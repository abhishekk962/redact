const fs = require("fs");
const path = require("node:path");
const pdf2md = require("@opendocsg/pdf2md");
const { LMStudioClient } = require("@lmstudio/sdk");
const { createMapping, decodeTemplate } = require("./utils/textUtils");
const {
  minimizeWindow,
  maximizeWindow,
  closeWindow,
  sendMessageToRenderer,
  setLoading,
  sendNotification,
} = require("./utils/windowUtils");
const {
  app,
  ipcMain,
  BrowserWindow,
  globalShortcut,
  clipboard,
} = require("electron");

// ----------------------------------------------------------------------------
// SECTION 1: LMStudioClient
// ----------------------------------------------------------------------------

const client = new LMStudioClient();

const modelPath = "Beta/Llama-3.2-3B-QNN";

// Look for the model, if not found, load it
async function loadModel() {
  model = await client.llm.get({ identifier: "my-model" }).catch(async () => {
    return await client.llm.load(modelPath, {
      config: {
        gpuOffload: {
          ratio: 1.0,
          mainGpu: 0,
          tensorSplit: [1.0],
        },
      },
      identifier: "my-model",
    });
  });
  return model;
}

// ----------------------------------------------------------------------------
// SECTION 2: Application window creation and management
// ----------------------------------------------------------------------------

// Create the main application window
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 250,
    height: 250,
    x: 1000,
    y: 480,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    frame: false,
    icon: path.join(__dirname, "icons", "icon.ico"),
  });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile("index.html");

  monitorClipboard();
}

// Create a new window to display the results (input and output text)
function createNewWindow(text1, text2) {
  const newWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    frame: false,
  });
  newWindow.loadFile("newWindow.html");
  newWindow.webContents.on("did-finish-load", () => {
    newWindow.webContents.send("send-text", text1, text2);
  });
  // newWindow.webContents.openDevTools()
}

// ----------------------------------------------------------------------------
// SECTION 3: Text processing functions
// ----------------------------------------------------------------------------

// Redact the text using the LLM model
async function redact(text) {
  setLoading(true);
  let length = text.length;
  let model;
  model = await loadModel();
  const prediction = model.complete(
    "Send it to 999-555-6273 " +
      text +
      "<|eot_id|>" +
      "Here is the text after replacing all personal details with placeholders like [NAME] etc.:\n\n" +
      "Send it to [PHONE_NUM] ",
    {
      maxPredictedTokens: Math.floor(length / 3.3),
    }
  );

  for await (const { content } of prediction) {
    process.stdout.write(content);
  }
  const result = await prediction;
  setLoading(false);
  return result.content;
}

// Check if the text contains PII (Personally Identifiable Information)
async function checkPII(text) {
  setLoading(true);
  let model;
  model = await loadModel();
  const prediction = model.respond([
    { role: "system", content: "You handle requests in a direct manner." },
    {
      role: "user",
      content:
        text +
        "Does this text contain any personal details like names, addresses, and phone numbers? Reply with YES or NO",
    },
  ]);
  const result = await prediction;
  setLoading(false);
  return result.content;
}

// Monitor the clipboard for changes every second
function monitorClipboard() {
  setInterval(() => {
    checkClipboard();
  }, 1000);
}

// Keep track of the last clipboard content so that we only trigger the LLM when the content changes
let lastClipboard = "";

// Check the clipboard content for PII and notify the user if PII is detected
function checkClipboard() {
  const text = clipboard.readText();
  if (text !== lastClipboard) {
    lastClipboard = text;
    if (text.length > 1000) {
      sendMessageToRenderer(
        "Clipboard text is too long. Detection of PII is disabled for large texts"
      );
      return;
    }
    checkPII(text).then((result) => {
      if (result.trim().charAt(0) !== "Y") {
        sendMessageToRenderer("No personal information detected in clipboard");
      }
      if (result.trim().charAt(0) === "Y") {
        sendMessageToRenderer("Personal information detected in clipboard");

        sendNotification(
          mainWindow,
          "Personal Information Detected",
          "Personal information detected in clipboard"
        );
      }
    });
  }
}

// Initialize a mapping object to store the template and actual values
// Example: { "NAME": "John", "PHONE_NUM": "123-456-7890" }
// This mapping object is used to replace placeholders in the template with actual values
let mapping = {};

// Redact the clipboard content and save a mapping of template words to actual words
function redactClipboard() {
  const text = clipboard.readText();
  if (text) {
    redact(text).then((result) => {
      mapping = createMapping(result, text);
      clipboard.writeText(result);
      createNewWindow(result, text);
      sendMessageToRenderer("Clipboard redacted");
    });
  } else {
    sendMessageToRenderer("No text found in clipboard");
  }
}

// Restore the clipboard content using the mapping object
function restoreClipboard() {
  const text = clipboard.readText();
  if (text) {
    const restored = decodeTemplate(text, mapping);
    clipboard.writeText(restored);
    createNewWindow(text, restored);
    sendMessageToRenderer("Clipboard restored");
  } else {
    sendMessageToRenderer("No text found in clipboard");
  }
}

// Read a file and redact its content and save the redacted content to a new file
async function redactFile(filePath) {
  try {
    setLoading(true);
    const extname = path.extname(filePath).toLowerCase();

    if (extname !== ".pdf" && extname !== ".txt") {
      sendMessageToRenderer(
        "Unsupported file type. Please select a PDF or TXT file."
      );
      return;
    }

    const pdfBuffer = fs.readFileSync(filePath);
    const duplicateFilePath = filePath.replace(/(\.[\w\d_-]+)$/i, "-REDACT$1");

    let text;
    if (extname === ".pdf") {
      text = await pdf2md(pdfBuffer);
    } else {
      text = fs.readFileSync(filePath, "utf-8");
    }

    const result = await redact(text);
    mapping = createMapping(result, text);
    createNewWindow(result, text);

    const outputFilePath =
      extname === ".pdf" ? duplicateFilePath + ".txt" : duplicateFilePath;
    fs.writeFileSync(outputFilePath, result);
  } catch (err) {
    console.error(`Error processing file: ${err.message}`);
  } finally {
    setLoading(false);
  }
}

// ----------------------------------------------------------------------------
// SECTION 4: IPC Handlers
// ----------------------------------------------------------------------------

ipcMain.on("minimize-window", (event) => {
  minimizeWindow();
});

ipcMain.on("maximize-window", (event) => {
  maximizeWindow();
});

ipcMain.on("close-window", (event) => {
  closeWindow();
});

ipcMain.on("open-new-window", (event, text1, text2) => {
  createNewWindow(text1, text2);
});

ipcMain.on("redact-clipboard", (event) => {
  redactClipboard();
});

ipcMain.on("restore-clipboard", (event) => {
  restoreClipboard();
});

ipcMain.handle("decode-word", (event, word) => {
  return mapping[word] || word;
});

ipcMain.on("redact-file", async (event, filePath) => {
  await redactFile(filePath);
});

// ----------------------------------------------------------------------------
// SECTION 5: App lifecycle events
// ----------------------------------------------------------------------------

// Unregister all shortcuts before quitting
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

// Initialize the application and create the main window when Electron is ready
app.whenReady().then(() => {
  createWindow();

  // Re-create a window if there are no open windows (macOS specific behavior)
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// App will quit when all windows are closed, except on macOS (darwin)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

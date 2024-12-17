// main.js

// Modules to control application life and create native browser window
const {
  app,
  BrowserWindow,
  globalShortcut,
  nativeImage,
  shell,
  clipboard,
  Tray,
  Menu,
  Notification
} = require("electron");
const path = require("node:path");
const { ipcMain } = require("electron");
const fs = require("fs");
const pdf2md = require("@opendocsg/pdf2md");

const { LMStudioClient } = require("@lmstudio/sdk");
const { screen } = require("electron");

const client = new LMStudioClient();
const modelPath = "Beta/Llama-3.2-3B-QNN";

let mapping = {};

const redactPrompt =
  'You are an assitant that replaces all personal details like names, addresses, and phone numbers with placeholders (e.g., [Name], [Address], [Phone Number]) and responds in this JSON format: {"redactedText": "The redacted text"}';

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
    newWindow.webContents.send("set-text-content", text1, text2);
  });
  // newWindow.webContents.openDevTools()
}

ipcMain.on("open-new-window", (event, text1, text2) => {
  createNewWindow(text1, text2);
});


ipcMain.on("redact-clipboard", (event) => {
  const text = clipboard.readText();
  if (text) {
    redact(text).then((result) => {
      clipboard.writeText(result);
      createNewWindow(result, text);
      sendMessageToRenderer("Clipboard redacted");
    });
  } else {
    sendMessageToRenderer("No text found in clipboard");
  }
});

ipcMain.on("restore-clipboard", (event) => {
  const text = clipboard.readText();
  if (text) {
    const text = clipboard.readText();
    const restored = decodeTemplate(text, mapping);
    clipboard.writeText(restored);
    createNewWindow(text, restored);
    sendMessageToRenderer("Clipboard restored");
  } else {
    sendMessageToRenderer("No text found in clipboard");
  }
});

async function redact(text) {
  setLoading(true);
  let model;
  model = await loadModel();

  // const prediction = model.complete([
  //   { role: "system", content: redactPrompt },
  //   {
  //     role: "user",
  //     content:
  //       "Please replace all personal details with placeholders like [Name] etc for the given text:" +
  //       text + "Here is the text after replacing all personal details with placeholders like [Name] etc {\"redactedText\": \"Example text redacted by [name]\"}",
  //   },
  // ]);
  const jsonSchema = {
    type: "object",
    properties: {
      content: { type: "string" },
    },
    required: ["content"],
  };
  const prediction = model.complete(
    text +
      "Here is the text after replacing all personal details with placeholders like [Name] etc",
    {
      maxPredictedTokens: 3500,
      structured: { type: "json", schema: jsonSchema },
    }
  );

  // let result = "";
  for await (const { content } of prediction) {
    // result += content;
    process.stdout.write(content);
  }
  const result = await prediction;
  // process.stdout.write(JSON.stringify(result));
  // process.stdout.write(result.content);
  setLoading(false);
  return result.content;
}

async function checkPII(text) {
  setLoading(true);
  let model;
  model = await loadModel();
  // const piiSchema = {
  //   content: "string",
  // };
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
  // process.stdout.write(JSON.stringify(result));
  // process.stdout.write(result.content);
  setLoading(false);
  return result.content;
}

let lastClipboard = "";

const createWindow = () => {
  const { sWidth, sHeight } = screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
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
    // skipTaskbar: true,
    // show: false,
  });
  mainWindow.setMenuBarVisibility(false);

  // and load the index.html of the app.
  mainWindow.loadFile("index.html");

  // mainWindow.on("blur", (e) => {
  //   mainWindow.hide();
  // });

  function monitorClipboard() {
    setInterval(() => {
      const text = clipboard.readText();
      if (text !== lastClipboard) {
        lastClipboard = text;
        process.stdout.write(text);
        checkPII(text).then((result) => {
          process.stdout.write(result);
          if (result.trim().charAt(0) === "Y") {
            sendMessageToRenderer("Personal information detected in clipboard");

            const notification = new Notification({
              title: "Personal Information Detected",
              body: "Personal information detected in clipboard",
              icon: path.join(__dirname, "icons", "info.png"),
            });
            app.focus({ steal: true });
            mainWindow.flashFrame(true);
            notification.show();

            notification.on("click", () => {
              shell.beep();
              mainWindow.show();
              mainWindow.focus();
            });
          }
        });
      }
    }, 1000);
  }
  monitorClipboard();
  // // Register a global shortcut for Ctrl+C
  // globalShortcut.register("CommandOrControl+C+1", () => {
  //   shell.beep();
  // });
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  const menuTemplate = [
    {
      id: "quit",
      label: "Quit",
      click: () => {
        app.exit();
      },
    },
  ];
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on("minimize-window", (event) => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) window.minimize();
});

ipcMain.on("maximize-window", (event) => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  }
});

ipcMain.on("close-window", (event) => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) window.close();
});

app.on("will-quit", () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});

function setLoading(isLoading) {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.webContents.send("set-loading", isLoading);
  }
  // process.stdout.write(`Loading: ${isLoading}\n`);
}

ipcMain.on("read-file", (event, filePath) => {
  setLoading(true);
  const pdfBuffer = fs.readFileSync(filePath);

  const extname = path.extname(filePath).toLowerCase();

  const duplicateFilePath = filePath.replace(/(\.[\w\d_-]+)$/i, "-DUPLICATE$1");

  if (extname === ".pdf") {
    pdf2md(pdfBuffer)
      .then((text) => {
        process.stdout.write(text);
        redact(text).then((result) => {
          fs.writeFile(duplicateFilePath + ".md", result, (err) => {
            if (err) {
              console.error(`Error writing file: ${err.message}`);
              return;
            }
          })
          setLoading(false);
        }
        );
        // process.stdout.write("Completed");
      })
      .catch((err) => {
        console.error(err);
      });
  } else {
    fs.readFile(filePath, "utf-8", (err, data) => {
      if (err) {
        console.error(`Error reading file: ${err.message}`);
        return;
      }
      redact(data).then((result) => {
        decoded = decodeTemplate(data, createMapping(data, result));
        createNewWindow(result, decoded);
        fs.writeFile(duplicateFilePath, result, (err) => {
          if (err) {
            console.error(`Error writing file: ${err.message}`);
            return;
          }
        });
        // process.stdout.write("Completed");
        setLoading(false);
      });
    });
  }
});

function sendMessageToRenderer(message) {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.webContents.send("display-message", message);
  }
}


function createMapping(template, actual) {
  const templateWords = template.split(" ");
  const actualWords = actual.split(" ");

  // Find placeholders (words wrapped in brackets) in the template
  const placeholders = templateWords.map((word, index) => ({
    isPlaceholder: word.startsWith("[") && word.endsWith("]"),
    word,
    index,
  }));

  // Filter out the non-placeholder words from the template
  const nonPlaceholderWords = templateWords.filter(
    (word) => !word.startsWith("[") || !word.endsWith("]")
  );

  // Filter out non-placeholder words from the actual sentence
  const actualFiltered = actualWords.filter(
    (word) => !nonPlaceholderWords.includes(word)
  );

  // Map placeholders to actual values
  placeholders.forEach((placeholder) => {
    if (placeholder.isPlaceholder) {
      const key = placeholder.word.replace(/[\[\]]/g, ""); // Remove brackets
      const actualValue = actualFiltered.shift(); // Get the next actual word
      mapping[key] = actualValue;
    }
  });

  return mapping;
}


function decodeTemplate(template) {
  process.stdout.write(`Template: ${JSON.stringify(mapping)}\n`);
  // Replace each placeholder in the template with its corresponding value
  return template.replace(/\[.*?\]/g, (match) => {
    const key = match.replace(/[\[\]]/g, ""); // Extract key without brackets
    return mapping[key] || match; // Replace with value from mapping or keep original
  });
}
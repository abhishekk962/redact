const { BrowserWindow, Notification } = require("electron");
const path = require("node:path");

// Minimize the window
function minimizeWindow() {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.minimize();
  }
}

// Maximize the window
function maximizeWindow() {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  }
}

// Close the window
function closeWindow() {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.close();
  }
}

// Helper function to send messages to the renderer process (Displayed as a popup)
function sendMessageToRenderer(message) {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.webContents.send("display-message", message);
  }
}
// Set the loading state in the renderer process to show a loading spinner
function setLoading(isLoading) {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.webContents.send("set-loading", isLoading);
  }
}

// Notify the user when PII is detected by sending a notification and flashing the taskbar icon
function sendNotification(window, app, title, body) {
  const notification = new Notification({
    title: title,
    body: body,
    icon: path.join(__dirname, "../../public/icons/info.png"),
  });
  app.focus({ steal: true });
  window.flashFrame(true);
  notification.show();

  notification.on("click", () => {
    window.show();
    window.focus();
  });
}

module.exports = {
  minimizeWindow,
  maximizeWindow,
  closeWindow,
  sendMessageToRenderer,
  setLoading,
  sendNotification,
};

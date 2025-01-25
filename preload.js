const { ipcRenderer, contextBridge, webUtils } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  closeWindow: () => {
    ipcRenderer.send("close-window");
  },
  minimizeWindow: () => {
    ipcRenderer.send("minimize-window");
  },
  maximizeWindow: () => {
    ipcRenderer.send("maximize-window");
  },
  redactClipboard: () => {
    ipcRenderer.send("redact-clipboard");
  },
  restoreClipboard: () => {
    ipcRenderer.send("restore-clipboard");
  },
  decodeTemplate: (text) => {
    ipcRenderer.invoke("decode-template", text);
  },
  onLoadingStateChange: (callback) => {
    ipcRenderer.on("set-loading", (event, isLoading) => callback(isLoading));
  },
  onDisplayMessage: (callback) => {
    ipcRenderer.on("display-message", (event, message) => callback(message));
  },
  onSendText: (callback) => {
    ipcRenderer.on("send-text", (event, text1, text2) =>
      callback(text1, text2)
    );
  },
  redactFile: (file) => {
    ipcRenderer.send("redact-file", webUtils.getPathForFile(file));
  },
  decodeWord: (text) => {
    return ipcRenderer.invoke("decode-word", text);
  },
});

// preload.js

const { ipcRenderer, contextBridge, webUtils } = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {
  minimizeWindow: () => ipcRenderer.send("minimize-window"),
  maximizeWindow: () => ipcRenderer.send("maximize-window"),
  closeWindow: () => ipcRenderer.send("close-window"),
  readFile: (file) => {
    const path = webUtils.getPathForFile(file)
    ipcRenderer.send("read-file", path)
  },
  onLoadingStateChange: (callback) => ipcRenderer.on("set-loading", (event, isLoading) => callback(isLoading)),
  onDisplayMessage: (callback) => ipcRenderer.on("display-message", (event, message) => callback(message)),
  onTextContent: (callback) => ipcRenderer.on("set-text-content", (event, text1, text2) => callback(text1, text2)),

})

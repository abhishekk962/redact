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
})

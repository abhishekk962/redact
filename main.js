// main.js

// Modules to control application life and create native browser window
const {
  app,
  BrowserWindow,
  globalShortcut,
  nativeImage,
  shell,
} = require("electron")
const path = require("node:path")
const { ipcMain } = require("electron")
const fs = require("fs")

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 300,
    height: 350,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    frame: false,
    icon: path.join(__dirname, "icons", "icon.ico"),
  })
  mainWindow.setMenuBarVisibility(false)

  // and load the index.html of the app.
  mainWindow.loadFile("index.html")
  // Register a global shortcut for Ctrl+C
  globalShortcut.register("CommandOrControl+C+1", () => {
    const overlayImage = nativeImage.createFromPath("icons/circle.png") // Update with your overlay icon path
    mainWindow.setOverlayIcon(overlayImage, "Description for overlay") // Apply overlay icon
    shell.beep()
  })
  // Open the DevTools.
  //   mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on("minimize-window", (event) => {
  const window = BrowserWindow.getFocusedWindow()
  if (window) window.minimize()
})

ipcMain.on("maximize-window", (event) => {
  const window = BrowserWindow.getFocusedWindow()
  if (window) {
    if (window.isMaximized()) {
      window.unmaximize()
    } else {
      window.maximize()
    }
  }
})

ipcMain.on("close-window", (event) => {
  const window = BrowserWindow.getFocusedWindow()
  if (window) window.close()
})

app.on("will-quit", () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll()
})

ipcMain.on("read-file", (event, filePath) => {
  // Read the file using fs
  fs.readFile(filePath, "utf-8", (err, data) => {
    if (err) {
      console.error(`Error reading file: ${err.message}`)
      return
    }
    const duplicateFilePath = filePath.replace(
      /(\.[\w\d_-]+)$/i,
      "-DUPLICATE$1"
    )
    fs.writeFile(duplicateFilePath, data, (err) => {
      if (err) {
        console.error(`Error writing file: ${err.message}`)
        return
      }
      console.log(`File duplicated successfully: ${duplicateFilePath}`)
    })
  })
})

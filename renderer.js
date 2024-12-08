document.getElementById("minimize-btn").addEventListener("click", () => {
  window.electronAPI.minimizeWindow()
})

document.getElementById("maximize-btn").addEventListener("click", () => {
  window.electronAPI.maximizeWindow()
})

document.getElementById("close-btn").addEventListener("click", () => {
  window.electronAPI.closeWindow()
})
const dropArea = document.getElementById("drop-area")
const dropAreaIcon = document.getElementById("drop-area-icon")

// Prevent default behavior for drag-and-drop events
;["dragenter", "dragover", "dragleave", "drop"].forEach((event) => {
  dropArea.addEventListener(event, (e) => {
    e.preventDefault()
    e.stopPropagation()
  })
})

// Highlight the drop area on drag over
;["dragenter", "dragover"].forEach((event) => {
  dropArea.addEventListener(event, () => {
    dropArea.classList.add("highlight")
  })
})

// Remove highlight when drag leaves or drop occurs
;["dragleave", "drop"].forEach((event) => {
  dropArea.addEventListener(event, () => {
    dropArea.classList.remove("highlight")
  })
})
// Handle dropped files
dropArea.addEventListener("drop", (e) => {
  const files = e.dataTransfer.files
  if (files.length) {
    const file = files[0] // Get the path of the first dropped file
    window.electronAPI.readFile(file)
  }
})

// Handle file picker
dropAreaIcon.addEventListener("click", () => {
  const input = document.createElement("input")
  input.type = "file"
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      window.electronAPI.readFile(file)
    }
  }
  input.click()
})
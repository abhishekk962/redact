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
const loadingIndicator = document.getElementById("loading-indicator");
const clipboard = document.getElementById("clipboard");
const restore = document.getElementById("restore");

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
dropArea.addEventListener("click", () => {
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

clipboard.addEventListener("click", () => {
  window.electronAPI.redactClipboard()
})

restore.addEventListener("click", () => {
  window.electronAPI.restoreClipboard()
})

// Listen for loading state changes
window.electronAPI.onLoadingStateChange((isLoading) => {
  if (isLoading) {
    loadingIndicator.style.display = "flex";
  } else {
    loadingIndicator.style.display = "none";
  }
});


// Listen for messages from the main process
window.electronAPI.onDisplayMessage((message) => {
  displayPopup(message);
});

// Function to display a popup message
function displayPopup(message) {
  const popup = document.createElement("div");
  popup.className = "popup-message";
  popup.textContent = message;
  document.body.appendChild(popup);

  setTimeout(() => {
    popup.classList.add("show");
  }, 10);

  setTimeout(() => {
    popup.classList.remove("show");
    setTimeout(() => {
      document.body.removeChild(popup);
    }, 300);
  }, 3000);
}

// Function to open a new window with text content
function openNewWindowWithText(text1, text2) {
  window.electronAPI.openNewWindow(text1, text2);
}
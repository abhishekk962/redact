# R.E.D.A.C.T

**R.E.D.A.C.T** (Restricting Exposed Data by Anonymization for Confidential Transmission) is an Electron-based application that helps you redact personal information from text documents and clipboard content. It also allows you to restore the original content from redacted text using a predefined mapping.

## Features

- Redact personal information from text documents and clipboard content.
- Restore original content from redacted text.
- Drag-and-drop support for files.
- Visual indicators for loading states.
- Popup messages for user notifications.

## Preview

![R.E.D.A.C.T Preview](images/preview.png)

## Installation

1. Clone the repository:

    ```sh
    git clone https://github.com/abhishekk962/redact.git
    cd redact
    ```

2. Install dependencies:

    ```sh
    npm install
    ```

3. Install LM Studio from [https://lmstudio.ai/](https://lmstudio.ai/).

4. Start the application:

    ```sh
    npm start
    ```

## Usage

### Redact Clipboard Content
Click the "Redact Clipboard" button to redact personal information from the clipboard content.  
The redacted content will be displayed in a new window.

### Restore Clipboard Content
Click the "Restore Clipboard" button to restore the original content from the redacted text in the clipboard.  
The restored content will be displayed in a new window.

### Redact Document
Drag and drop a text document onto the "Redact Document" area.  
The redacted content will be displayed in a new window.

## Development

### Main Process
The main process is defined in `main.js`. It handles the creation of browser windows, IPC communication, and the redaction and restoration of text content.

### Renderer Process
The renderer process is defined in `renderer.js` and `newWindowRenderer.js`. It handles the UI interactions and communicates with the main process via IPC.

### Preload Script
The preload script is defined in `preload.js`. It exposes the IPC methods to the renderer process.

### Styles
The styles are defined in `style.css`. It includes styles for the title bar, content area, buttons, and loading indicators.

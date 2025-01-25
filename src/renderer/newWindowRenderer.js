document.getElementById("minimize-btn").addEventListener("click", () => {
  window.electronAPI.minimizeWindow();
});

document.getElementById("maximize-btn").addEventListener("click", () => {
  window.electronAPI.maximizeWindow();
});

document.getElementById("close-btn").addEventListener("click", () => {
  window.electronAPI.closeWindow();
});
window.electronAPI.onSendText((text1, text2) => {
  const keywords = extractKeywords(text1);
  const highlightedText = highlightKeywords(text1, keywords);
  document.getElementById("text-content1").innerHTML = highlightedText;
  document.getElementById("text-content2").innerHTML = text2;
  addClickEventToHighlights();
});

function extractKeywords(text) {
  const regex = /\[([^\]]+)\]/g;
  const keywords = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    keywords.push(match[1]);
  }
  return keywords;
}

function highlightKeywords(text, keywords) {
  let highlightedText = text;
  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\[${keyword}\\]`, "gi");
    highlightedText = highlightedText.replace(
      regex,
      `<span class="highlight">[${keyword}]</span>`
    );
  });
  return highlightedText;
}

function addClickEventToHighlights() {
  const highlights = document.querySelectorAll(".highlight");
  highlights.forEach((highlight) => {
    highlight.addEventListener("click", function () {
      console.log(`Clicked on: ${this.textContent}`);
      let content = this.textContent;
      content = content.replace(/[\[\]]/g, "");
      window.electronAPI.decodeWord(content).then((decodedValue) => {
        this.outerHTML = decodedValue;
      });
    });
  });
}

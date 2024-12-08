// newWindowRenderer.js
document.getElementById("minimize-btn").addEventListener("click", () => {
    window.electronAPI.minimizeWindow();
  });
  
  document.getElementById("maximize-btn").addEventListener("click", () => {
    window.electronAPI.maximizeWindow();
  });
  
  document.getElementById("close-btn").addEventListener("click", () => {
    window.electronAPI.closeWindow();
  });
  window.electronAPI.onTextContent((text1, text2) => {
    const keywords = extractKeywords(text1);
    const highlightedText = highlightKeywords(text1, keywords);
    document.getElementById("text-content1").innerHTML = highlightedText;
    document.getElementById("text-content2").innerHTML = text2;

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
      const regex = new RegExp(`\\[${keyword}\\]`, 'gi');
      highlightedText = highlightedText.replace(regex, `<span class="highlight">${keyword}</span>`);
    });
    return highlightedText;
  }
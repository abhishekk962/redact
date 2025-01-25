// Create a mapping of template words ([NAME]) to actual words (John)
function createMapping(template, actual) {
  let mapping = {};
  // Split the template and actual sentences into words
  const templateWords = template.split(" ");
  const actualWords = actual.split(" ");

  // Find placeholders (words wrapped in brackets - []) in the template
  const placeholders = templateWords.map((word, index) => ({
    isPlaceholder: word.includes("[") && word.includes("]"),
    word,
    index,
  }));

  // Filter out the non-placeholder words from the template
  const nonPlaceholderWords = templateWords.filter(
    (word) => !word.includes("[") || !word.includes("]")
  );

  // Filter out non-placeholder words from the actual sentence
  const actualFiltered = actualWords.filter(
    (word) => !nonPlaceholderWords.includes(word)
  );

  // Map placeholders to actual values
  placeholders.forEach((placeholder) => {
    if (placeholder.isPlaceholder) {
      let key = placeholder.word.replace(/[\[\]]/g, ""); // Remove brackets
      key = key.replace(/[^a-zA-Z0-9]/g, ""); // remove special characters from key
      let actualValue = actualFiltered.shift(); // Get the next actual word
      actualValue = actualValue.replace(/[^a-zA-Z0-9]/g, "");
      mapping[key] = actualValue;
    }
  });

  return mapping;
}

// Decode the template using the mapping object
function decodeTemplate(template, mapping) {
  return template.replace(/\[.*?\]/g, (match) => {
    const key = match.replace(/[\[\]]/g, "");
    return mapping[key] || match;
  });
}

module.exports = {
  createMapping,
  decodeTemplate,
};

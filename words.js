// ===============================
// words.js
// Loads the dictionary from words.txt
// Provides WORD_LIST and WORDS_READY
// ===============================

const WORD_LIST = [];

const WORDS_READY = fetch("./words.txt", { cache: "no-store" })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Failed to load words.txt: ${response.status} ${response.statusText}`);
    }
    return response.text();
  })
  .then(text => {
    console.log("words.txt raw length:", text.length);

    const lines = text.split(/\r?\n/);

    for (let word of lines) {
      word = word.trim().toLowerCase();

      if (word.length >= 4 && /^[a-z]+$/.test(word)) {
        WORD_LIST.push(word);
      }
    }

    console.log("Loaded words into WORD_LIST:", WORD_LIST.length);

    if (WORD_LIST.length === 0) {
      throw new Error("words.txt loaded, but no valid words passed filtering.");
    }
  })
  .catch(err => {
    console.error("Error loading words.txt:", err);
  });

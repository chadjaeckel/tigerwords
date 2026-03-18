// =======================================
// puzzle.js — Revised Full Version
// =======================================

// Minimum word length
const MIN_WORD_LENGTH = 4;

// Minimum and maximum number of valid words a puzzle must have
const MIN_VALID_WORDS = 20;
const MAX_VALID_WORDS = 250;

/* ============================================================
   COMPLETE WORD VALIDATOR
   ============================================================ */
function isValidWord(word, puzzle) {
  if (!word || !puzzle || !puzzle.letters || !puzzle.required) {
    return false;
  }

  word = word.toLowerCase();

  // 1. Must be at least 4 letters
  if (word.length < MIN_WORD_LENGTH) return false;

  // 2. Must contain the required (center) letter
  if (!word.includes(puzzle.required)) return false;

  // 3. Must exist in the dictionary
  if (!WORD_LIST.includes(word)) return false;

  // 4. Build puzzle letter frequency map
  const freq = {};
  puzzle.letters.forEach(ch => {
    freq[ch] = (freq[ch] || 0) + 1;
  });

  // 5. Build usage map for guessed word
  const used = {};
  for (const ch of word) {
    if (!freq[ch]) return false;

    used[ch] = (used[ch] || 0) + 1;
    if (used[ch] > freq[ch]) return false;
  }

  return true;
}

/* ============================================================
   FIND ALL VALID WORDS
   ============================================================ */
function findValidWords(puzzle) {
  if (!WORD_LIST || WORD_LIST.length === 0) {
    console.warn("WORD_LIST is empty or not loaded yet.");
    return [];
  }

  return WORD_LIST.filter(word => isValidWord(word, puzzle));
}

/* ============================================================
   SHUFFLE ARRAY
   ============================================================ */
function shuffle(arr) {
  const copy = [...arr];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

/* ============================================================
   GENERATE PUZZLE FROM A 9-LETTER BASE WORD
   ============================================================ */
function generatePuzzle() {
  if (!WORD_LIST || WORD_LIST.length === 0) {
    console.error("WORD_LIST not loaded — cannot generate puzzle.");
    return null;
  }

  // Use all 9-letter words as possible base words
  const nineLetterWords = WORD_LIST.filter(w => w.length === 9);

  if (nineLetterWords.length === 0) {
    console.error("No 9-letter words found.");
    return null;
  }

  // Shuffle candidates so puzzle selection stays random
  const candidates = shuffle(nineLetterWords);

  for (const baseWord of candidates) {
    const letters = shuffle(baseWord.split(""));
    const required = letters[4];

    const puzzle = {
      letters,
      required,
      centerIndex: 4,
      baseWord,
      validWords: []
    };

    const valid = findValidWords(puzzle);

    if (valid.length >= MIN_VALID_WORDS && valid.length <= MAX_VALID_WORDS) {
      puzzle.validWords = valid;
      console.log(
        `Puzzle accepted: ${baseWord} (${valid.length} valid words)`
      );
      return puzzle;
    }
  }

  console.error("No suitable puzzle found.");
  return null;
}

/* ============================================================
   WAIT FOR DICTIONARY
   ============================================================ */
WORDS_READY.then(() => {
  console.log("Dictionary loaded — puzzle.js ready.");
});

/* ============================================================
   EXPORTS
   ============================================================ */
window.Puzzle = {
  generatePuzzle,
  findValidWords
};
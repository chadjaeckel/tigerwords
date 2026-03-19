// =======================================
// puzzle.js — Corrected Full Version
// =======================================

// Minimum word length
const MIN_WORD_LENGTH = 4;

// Minimum number of valid words a puzzle must have
const MIN_VALID_WORDS = 20;

/* ============================================================
   COMPLETE WORD VALIDATOR
   ============================================================ */
function isValidWord(word, puzzle) {
    if (!word) return false;

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
    for (let ch of word) {
        if (!freq[ch]) return false; // letter not allowed

        used[ch] = (used[ch] || 0) + 1;

        if (used[ch] > freq[ch]) return false; // used too many times
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
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/* ============================================================
   FILTER OUT OBSCURE WORDS
   ============================================================ */
const COMMON_5 = new Set([
    "about", "after", "again", "below", "could", "every", "first",
    "found", "great", "house", "large", "learn", "never", "place",
    "plant", "point", "right", "small", "sound", "spell", "still",
    "study", "their", "there", "these", "thing", "think", "three",
    "water", "where", "which", "world", "would", "write"
]);

function hasCommonSubword(word) {
    for (let i = 0; i <= word.length - 5; i++) {
        const chunk = word.slice(i, i + 5);
        if (COMMON_5.has(chunk)) return true;
    }
    return false;
}

/* ============================================================
   GENERATE PUZZLE FROM A 9‑LETTER BASE WORD
   ============================================================ */
function generatePuzzle() {
    if (!WORD_LIST || WORD_LIST.length === 0) {
        console.error("WORD_LIST not loaded — cannot generate puzzle.");
        return null;
    }

    // Filter to 9‑letter words
    let nineLetterWords = WORD_LIST.filter(w => w.length === 9);

    if (nineLetterWords.length === 0) {
        console.error("No 9-letter words found.");
        return null;
    }

    let attempts = 0;

    while (true) {
        attempts++;

        // Pick a base word
        const baseWord = nineLetterWords[
            Math.floor(Math.random() * nineLetterWords.length)
        ];

        // Skip obscure base words
        if (!hasCommonSubword(baseWord)) continue;

        // Break into letters and shuffle
        const letters = shuffle(baseWord.split(""));

        // Required letter is the center tile
        const required = letters[4];

        // Build puzzle object
        const puzzle = {
            letters,
            required,
            centerIndex: 4,
            baseWord,
            validWords: []
        };

        // Find all valid words
        const valid = findValidWords(puzzle);

        // Only accept puzzles with a reasonable number of valid words
        if (valid.length >= MIN_VALID_WORDS && valid.length <= 250) {
            puzzle.validWords = valid;
            console.log(
                `Puzzle accepted after ${attempts} tries: ${baseWord} (${valid.length} valid words)`
            );
            return puzzle;
        }

        // Otherwise try another base word
    }
}

/* ============================================================
   WAIT FOR DICTIONARY
   ============================================================ */
WORDS_READY.then(() => {
    console.log("Dictionary loaded — puzzle.js ready (corrected version).");
});

/* ============================================================
   EXPORTS
   ============================================================ */
window.generatePuzzle = generatePuzzle;
window.findValidWords = findValidWords;

window.Puzzle = {
    generatePuzzle,
    findValidWords
};

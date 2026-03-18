// ===============================
// commands.js
// Parses spoken text into game commands
// ===============================

const Commands = (() => {

  function parse(text) {
    if (!text) return { type: "unknown" };

    // Normalize input
    text = text.toLowerCase().trim();

    // Remove punctuation so "found?" matches "found"
    text = text.replace(/[^\w\s]/g, "");

    // -------------------------------
    // GUESS A WORD (single word only)
    // -------------------------------
    if (/^[a-z]+$/.test(text) && text.split(" ").length === 1) {
      return { type: "guess", payload: text };
    }

    // -------------------------------
    // READ GRID
    // -------------------------------
    if (
      text.includes("read grid") ||
      text.includes("read letters") ||
      text.includes("say the letters") ||
      text.includes("what are the letters")
    ) {
      return { type: "read_grid" };
    }

    // -------------------------------
    // HINT
    // -------------------------------
    if (
      text.includes("hint") ||
      text.includes("give me a hint") ||
      text.includes("help me") ||
      text.includes("clue")
    ) {
      return { type: "hint" };
    }

    // -------------------------------
    // REPEAT LAST MESSAGE
    // -------------------------------
    if (
      text.includes("repeat") ||
      text.includes("say that again") ||
      text.includes("what did you say")
    ) {
      return { type: "repeat" };
    }

    // -------------------------------
    // READ FOUND WORDS
    // -------------------------------
    if (
      text.includes("found words") ||
      text.includes("list words") ||
      text.includes("list found words") ||
      text.includes("read found words") ||
      text.includes("read my words") ||
      text.includes("say all words i found") ||
      text.includes("what have i found") ||
      text.includes("what words have i found") ||
      text.includes("what words did i find") ||
      text.includes("tell me my words") ||
      text.includes("read my found words")
    ) {
      return { type: "read_found_words" };
    }

    // -------------------------------
    // READ REMAINING WORDS (NEW)
    // -------------------------------
    if (
      text.includes("how many words are left") ||
      text.includes("how many words left") ||
      text.includes("words remaining") ||
      text.includes("what words are left") ||
      text.includes("how many do i have left") ||
      text.includes("read remaining words") ||
      text.includes("tell me whats left") ||
      text.includes("tell me what is left")
    ) {
      return { type: "read_remaining_words" };
    }

    // -------------------------------
    // UNKNOWN COMMAND
    // -------------------------------
    return { type: "unknown", raw: text };
  }

  return { parse };

})();

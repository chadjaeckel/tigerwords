// ===============================
// Accessible Word Grid - game.js
// ===============================

// Global game state
let gameState = null;

// ===============================
// Persistent Game Statistics
// ===============================
const statsKey = "wordGridStats";

let stats = {
  gamesPlayed: 0,
  totalWordsFound: 0,
  totalPoints: 0
};

function loadStats() {
  try {
    const saved = localStorage.getItem(statsKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      stats = {
        gamesPlayed: Number(parsed.gamesPlayed) || 0,
        totalWordsFound: Number(parsed.totalWordsFound) || 0,
        totalPoints: Number(parsed.totalPoints) || 0
      };
    }
  } catch (error) {
    console.warn("Could not load stats from localStorage:", error);
    stats = {
      gamesPlayed: 0,
      totalWordsFound: 0,
      totalPoints: 0
    };
  }

  updateStatsUI();
}

function saveStats() {
  try {
    localStorage.setItem(statsKey, JSON.stringify(stats));
  } catch (error) {
    console.warn("Could not save stats to localStorage:", error);
  }
}

function updateStatsUI() {
  const container = document.getElementById("stats");
  if (!container) return;

  container.innerHTML = `
    <h3>Statistics</h3>
    <p>Games Played: ${stats.gamesPlayed}</p>
    <p>Total Words Found: ${stats.totalWordsFound}</p>
    <p>Total Points: ${stats.totalPoints}</p>
  `;
}

document.addEventListener("DOMContentLoaded", loadStats);

// ===============================
// Helpers
// ===============================
function setStatus(message, speak = false) {
  const status = document.getElementById("status");
  if (status) {
    status.textContent = message;
  }

  if (speak && typeof Speech !== "undefined" && Speech.speak) {
    Speech.speak(message);
  }
}

function startListening() {
  if (!gameState || !gameState.puzzle) {
    setStatus("Start a game before using voice commands.", true);
    return;
  }

  setStatus("Listening...");

  Speech.pushToTalk(text => {
    const result = Commands.parse(text);
    handleCommandResult(result, text);
  });
}

function stopListening() {
  Speech.stopListening();
  setStatus("Stopped listening.");
}

// ===============================
// End-of-Game Summary
// ===============================
function getLongestFoundWord() {
  if (!gameState || !gameState.foundWords || gameState.foundWords.size === 0) {
    return null;
  }

  let longest = "";

  for (const word of gameState.foundWords) {
    if (word.length > longest.length) {
      longest = word;
    }
  }

  return longest;
}

function buildEndGameSummary() {
  if (!gameState || !gameState.puzzle) return null;

  const totalValidWords = gameState.puzzle.validWords.length;
  const foundCount = gameState.foundWords.size;
  const missedCount = totalValidWords - foundCount;
  const longestWord = getLongestFoundWord() || "None";
  const totalScore = gameState.players.reduce((sum, player) => sum + player.score, 0);

  return {
    totalScore,
    totalWordsFound: foundCount,
    totalValidWords,
    missedWords: missedCount,
    longestWord
  };
}

function showEndGameSummary() {
  const container = document.getElementById("end-summary");
  if (!container) return;

  const summary = buildEndGameSummary();
  if (!summary) return;

  const missedWords = gameState.puzzle.validWords
    .filter(word => !gameState.foundWords.has(word))
    .sort();

  container.hidden = false;
  container.innerHTML = `
    <h2>Game Summary</h2>
    <ul>
      <li><strong>Total Score:</strong> ${summary.totalScore}</li>
      <li><strong>Words Found:</strong> ${summary.totalWordsFound} of ${summary.totalValidWords}</li>
      <li><strong>Longest Word Found:</strong> ${summary.longestWord}</li>
      <li><strong>Words Missed:</strong> ${summary.missedWords}</li>
    </ul>
    ${
      missedWords.length
        ? `<h3>Missed Words</h3><p>${missedWords.join(", ")}</p>`
        : `<p><strong>You found every word.</strong></p>`
    }
  `;

  setStatus(
    `Game over. You found ${summary.totalWordsFound} words. Longest word: ${summary.longestWord}.`,
    true
  );
}

function hideEndGameSummary() {
  const container = document.getElementById("end-summary");
  if (!container) return;

  container.hidden = true;
  container.innerHTML = "";
}

function checkForGameEnd() {
  if (!gameState || !gameState.puzzle) return false;

  const totalValidWords = gameState.puzzle.validWords.length;
  const foundCount = gameState.foundWords.size;

  if (foundCount >= totalValidWords) {
    showEndGameSummary();
    return true;
  }

  return false;
}

// ===============================
// FUZZY MATCHING (LEVENSHTEIN)
// ===============================
function levenshtein(a, b) {
  const dp = Array(a.length + 1)
    .fill(null)
    .map(() => Array(b.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[a.length][b.length];
}

// ===============================
// PHONETIC MATCHING (METAPHONE)
// ===============================
function metaphone(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!word) return "";

  const vowels = "aeiou";
  let result = "";

  for (let i = 0; i < word.length; i++) {
    const c = word[i];

    if (vowels.includes(c)) {
      if (i === 0) result += c;
      continue;
    }

    if ("bcdgptvqxz".includes(c)) {
      result += c;
    }
  }

  return result;
}

// ===============================
// SMART GUESS
// ===============================
function smartGuess(word, validWords) {
  if (validWords.includes(word)) return word;

  const targetMeta = metaphone(word);
  const phoneticMatches = validWords.filter(w => metaphone(w) === targetMeta);
  if (phoneticMatches.length > 0) return phoneticMatches[0];

  let best = null;
  let bestDist = Infinity;

  validWords.forEach(w => {
    const d = levenshtein(word, w);
    if (d < bestDist) {
      bestDist = d;
      best = w;
    }
  });

  return bestDist <= 2 ? best : null;
}

// ===============================
// UPDATE FOUND WORDS
// ===============================
function updateFoundWords() {
  if (!gameState) return;

  const container = document.getElementById("found-words");
  if (!container) return;

  container.innerHTML = "<h2>Found Words</h2>";

  const ul = document.createElement("ul");

  Array.from(gameState.foundWords)
    .sort()
    .forEach(word => {
      const li = document.createElement("li");
      li.textContent = word;
      ul.appendChild(li);
    });

  container.appendChild(ul);
}

// ===============================
// UI UPDATE
// ===============================
function updateUI() {
  if (!gameState || !gameState.puzzle) return;

  const grid = document.getElementById("grid");
  if (grid) {
    grid.innerHTML = "";

    gameState.puzzle.letters.forEach((ch, i) => {
      const cell = document.createElement("div");
      cell.className = "cell";

      if (i === gameState.puzzle.centerIndex) {
        cell.classList.add("center");
      }

      cell.textContent = ch.toUpperCase();
      grid.appendChild(cell);
    });
  }

  const p1 = gameState.players[0];
  const p1Score = document.getElementById("p1-score");
  if (p1Score) {
    p1Score.textContent = `${p1.name}: ${p1.score} points`;
  }

  const p2Score = document.getElementById("p2-score");
  if (p2Score) {
    if (gameState.mode === "two") {
      const p2 = gameState.players[1];
      p2Score.hidden = false;
      p2Score.textContent = `${p2.name}: ${p2.score} points`;
    } else {
      p2Score.hidden = true;
      p2Score.textContent = "";
    }
  }
}

// ===============================
// HANDLE GUESS
// ===============================
function handleGuess(word) {
  if (!gameState || !gameState.puzzle) {
    setStatus("No game started yet.", true);
    return;
  }

  if (!word) return;

  word = word.trim().toLowerCase();

  if (!word) return;

  if (!gameState.puzzle.validWords.includes(word)) {
    const suggestion = smartGuess(word, gameState.puzzle.validWords);

    if (suggestion) {
      setStatus(`Did you mean ${suggestion}?`, true);
      return;
    }

    setStatus(`${word} is not valid.`, true);
    return;
  }

  if (gameState.foundWords.has(word)) {
    setStatus(`${word} was already found.`, true);
    return;
  }

  const points = word.length;
  const player = gameState.players[gameState.currentPlayerIndex];

  player.score += points;
  gameState.foundWords.add(word);

  stats.totalWordsFound += 1;
  stats.totalPoints += points;
  saveStats();
  updateStatsUI();

  setStatus(`${word} is valid for ${points} points.`, true);

  if (gameState.mode === "two") {
    gameState.currentPlayerIndex =
      gameState.currentPlayerIndex === 0 ? 1 : 0;
  }

  updateUI();
  updateFoundWords();
  checkForGameEnd();
}

// ===============================
// START GAME
// ===============================
document.getElementById("start-btn").addEventListener("click", async () => {
  try {
    setStatus("Loading words...");
    await WORDS_READY;

    if (!Array.isArray(WORD_LIST) || WORD_LIST.length === 0) {
      setStatus("Word list failed to load.", true);
      return;
    }

    stats.gamesPlayed += 1;
    saveStats();
    updateStatsUI();

    const mode = document.querySelector("input[name='mode']:checked").value;
    const p1Name = document.getElementById("player1-name").value.trim() || "Player 1";
    const p2Name = document.getElementById("player2-name").value.trim() || "Player 2";

    const puzzle = Puzzle.generatePuzzle();

    if (!puzzle) {
      setStatus("Could not generate a puzzle.", true);
      return;
    }

    puzzle.validWords = Puzzle.findValidWords(puzzle);

    gameState = {
      puzzle,
      players: [
        { name: p1Name, score: 0 },
        { name: p2Name, score: 0 }
      ],
      mode,
      currentPlayerIndex: 0,
      foundWords: new Set()
    };

    document.getElementById("game").hidden = false;

    hideEndGameSummary();
    updateUI();
    updateFoundWords();
    setStatus("Game started.", true);

    const typedInput = document.getElementById("typed-word");
    if (typedInput) {
      typedInput.focus();
      typedInput.select();
    }
  } catch (error) {
    console.error("Failed to start game:", error);
    setStatus("Could not start the game.", true);
  }
});

// ===============================
// TYPED INPUT
// ===============================
document.getElementById("typed-word").addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();

    const word = e.target.value.trim().toLowerCase();
    e.target.value = "";

    if (!word) return;

    handleGuess(word);
  }
});

// ===============================
// BUTTON HANDLERS
// ===============================
document.getElementById("hint-btn").addEventListener("click", giveHint);
document.getElementById("read-btn").addEventListener("click", readGridAloud);
document.getElementById("listen-btn").addEventListener("click", startListening);
document.getElementById("stop-btn").addEventListener("click", stopListening);

// ===============================
// PUSH-TO-TALK (SPACEBAR)
// Press and hold to listen, release to stop
// ===============================
let spaceDown = false;

document.addEventListener("keydown", e => {
  if (e.code === "Space" && !spaceDown) {
    e.preventDefault();
    spaceDown = true;
    startListening();
  }
});

document.addEventListener("keyup", e => {
  if (e.code === "Space" && spaceDown) {
    e.preventDefault();
    spaceDown = false;
    stopListening();
  }
});

// ===============================
// GLOBAL SHORTCUTS
// ===============================
document.addEventListener("keydown", e => {
  if (e.key === "1") {
    e.preventDefault();
    document.getElementById("start-btn").click();
  }

  if (e.key === "2") {
    e.preventDefault();
    readGridAloud();
  }
});

// ===============================
// GAME HELPERS
// ===============================
function readGridAloud() {
  if (!gameState || !gameState.puzzle) {
    setStatus("No game started yet.", true);
    return;
  }

  const letters = gameState.puzzle.letters.join(", ");
  setStatus(`The letters are: ${letters}.`, true);
}

function giveHint() {
  if (!gameState || !gameState.puzzle) {
    setStatus("No game started yet.", true);
    return;
  }

  const remaining = gameState.puzzle.validWords.filter(
    w => !gameState.foundWords.has(w)
  );

  if (remaining.length === 0) {
    setStatus("No words left.", true);
    showEndGameSummary();
    return;
  }

  setStatus(`A word starts with ${remaining[0][0]}.`, true);
}

function handleCommandResult(result, rawText) {
  switch (result.type) {
    case "guess":
      handleGuess(result.payload);
      break;

    case "read_grid":
      readGridAloud();
      break;

    case "hint":
      giveHint();
      break;

    case "repeat":
      setStatus(document.getElementById("status").textContent || "No status yet.", true);
      break;

    case "read_found_words":
      readFoundWordsAloud();
      break;

    case "read_remaining_words":
      readRemainingWords();
      break;

    default:
      setStatus(`I heard ${rawText}, but didn't understand.`, true);
  }
}

function readFoundWordsAloud() {
  if (!gameState || !gameState.puzzle) {
    setStatus("No game started yet.", true);
    return;
  }

  const words = Array.from(gameState.foundWords).sort();

  if (words.length === 0) {
    setStatus("You have not found any words yet.", true);
    return;
  }

  setStatus(`You have found the following words: ${words.join(", ")}.`, true);
}

function readRemainingWords() {
  if (!gameState || !gameState.puzzle) {
    setStatus("No game started yet.", true);
    return;
  }

  const remaining = gameState.puzzle.validWords.filter(
    w => !gameState.foundWords.has(w)
  );

  if (remaining.length === 0) {
    setStatus("You have found all words.", true);
    showEndGameSummary();
    return;
  }

  const counts = {};
  remaining.forEach(word => {
    const len = word.length;
    counts[len] = (counts[len] || 0) + 1;
  });

  const summary = Object.keys(counts)
    .sort((a, b) => Number(a) - Number(b))
    .map(len => `${counts[len]} ${len}-letter ${counts[len] === 1 ? "word" : "words"}`)
    .join(", ");

  setStatus(`You have ${remaining.length} words remaining: ${summary}.`, true);
}

// ===============================
// Accessible Word Grid - game.js
// ===============================

let gameState = null;

// ===============================
// STATUS
// ===============================
function setStatus(message, speak = false) {
  const status = document.getElementById("status");
  if (status) status.textContent = message;

  if (speak && Speech?.speak) {
    Speech.speak(message);
  }
}

// ===============================
// RESET / CLEAR
// ===============================
function resetGameUI() {
  document.getElementById("typed-word").value = "";
  document.getElementById("found-list").innerHTML = "";
  document.getElementById("status").textContent = "";
}

function clearEndGameUI() {
  const missed = document.getElementById("missed-words");
  if (missed) missed.remove();
}

// ===============================
// UPDATE FOUND WORDS
// ===============================
function updateFoundWords() {
  const list = document.getElementById("found-list");
  list.innerHTML = "";

  Array.from(gameState.foundWords)
    .sort()
    .forEach(word => {
      const li = document.createElement("li");
      li.textContent = word;
      list.appendChild(li);
    });
}

// ===============================
// UPDATE MISSED WORDS UI
// ===============================
function updateMissedWordsUI(missedWords) {
  let section = document.getElementById("missed-words");

  if (!section) {
    section = document.createElement("div");
    section.id = "missed-words";
    document.getElementById("game").appendChild(section);
  }

  const items = missedWords.map(w => `<li>${w}</li>`).join("");

  section.innerHTML = `
    <h3>Missed Words</h3>
    <p>You missed ${missedWords.length} words.</p>
    <ul>${items}</ul>
  `;
}

// ===============================
// READ MISSED WORDS (IMPROVED)
// ===============================
function readMissedWordsAloud() {
  if (!gameState || !gameState.isGameOver) {
    setStatus("End the game first.", true);
    return;
  }

  const missedWords = gameState.puzzle.validWords
    .filter(w => !gameState.foundWords.has(w))
    .sort();

  if (missedWords.length === 0) {
    setStatus("You found all words.", true);
    return;
  }

  Speech.speak(`You missed ${missedWords.length} words.`);

  const chunkSize = 5;
  let index = 0;

  function speakNext() {
    if (index >= missedWords.length) return;

    const chunk = missedWords.slice(index, index + chunkSize);
    index += chunkSize;

    Speech.speak(chunk.join(", "));
    setTimeout(speakNext, 2500);
  }

  setTimeout(speakNext, 1500);
}

// ===============================
// UPDATE UI
// ===============================
function updateUI() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  gameState.puzzle.letters.forEach((ch, i) => {
    const cell = document.createElement("div");
    cell.className = "cell";
    if (i === gameState.puzzle.centerIndex) cell.classList.add("center");
    cell.textContent = ch.toUpperCase();
    grid.appendChild(cell);
  });

  document.getElementById("p1-score").textContent =
    `${gameState.players[0].name}: ${gameState.players[0].score}`;

  const p2 = document.getElementById("p2-score");

  if (gameState.mode === "two") {
    p2.hidden = false;
    p2.textContent =
      `${gameState.players[1].name}: ${gameState.players[1].score}`;
  } else {
    p2.hidden = true;
  }
}

// ===============================
// HANDLE GUESS
// ===============================
function handleGuess(word) {
  if (!gameState || gameState.isGameOver) {
    setStatus("Game not active.", true);
    return;
  }

  word = word.trim().toLowerCase();

  if (!gameState.puzzle.validWords.includes(word)) {
    setStatus(`${word} is not valid.`, true);
    return;
  }

  if (gameState.foundWords.has(word)) {
    setStatus("Already found.", true);
    return;
  }

  const player = gameState.players[gameState.currentPlayerIndex];

  player.score += word.length;
  gameState.foundWords.add(word);

  setStatus(`${word} accepted.`, true);

  updateUI();
  updateFoundWords();

  const remaining = gameState.puzzle.validWords.filter(
    w => !gameState.foundWords.has(w)
  );

  if (remaining.length === 0) {
    endGame();
  }
}

// ===============================
// END GAME
// ===============================
function endGame() {
  if (!gameState || gameState.isGameOver) return;

  gameState.isGameOver = true;

  const missed = gameState.puzzle.validWords.filter(
    w => !gameState.foundWords.has(w)
  );

  const player = gameState.players[0];

  const summary =
    `Game ended. You found ${gameState.foundWords.size} words. ` +
    `You missed ${missed.length}. Score ${player.score}.`;

  setStatus(summary, true);
  updateMissedWordsUI(missed);

  // Auto-read missed words after summary
  setTimeout(readMissedWordsAloud, 2500);
}

// ===============================
// START GAME
// ===============================
document.getElementById("start-btn").addEventListener("click", async () => {
  await WORDS_READY;

  const puzzle = Puzzle.generatePuzzle();
  puzzle.validWords = Puzzle.findValidWords(puzzle);

  gameState = {
    puzzle,
    players: [{ name: "Player", score: 0 }],
    mode: "one",
    currentPlayerIndex: 0,
    foundWords: new Set(),
    isGameOver: false
  };

  document.getElementById("game").hidden = false;

  clearEndGameUI();
  resetGameUI();
  updateUI();

  setStatus("Game started.", true);
});

// ===============================
// INPUT
// ===============================
document.getElementById("typed-word").addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const word = e.target.value;
    e.target.value = "";
    handleGuess(word);
  }
});
// ===============================
// GLOBAL KEYBOARD SHORTCUTS
// ===============================
document.addEventListener("keydown", e => {
  // Start Game with "1"
  if (e.key === "1") {
    e.preventDefault();

    if (gameState && !gameState.isGameOver) {
      setStatus("Game already in progress.", true);
      return;
    }

    document.getElementById("start-btn")?.click();
  }

  // End Game with "2"
  if (e.key === "2") {
    e.preventDefault();

    if (!gameState || gameState.isGameOver) {
      setStatus("No active game to end.", true);
      return;
    }

    endGame();
  }
});

// ===============================
// PUSH-TO-TALK (SPACE BAR)
// ===============================
let spaceHeld = false;

document.addEventListener("keydown", e => {
  if (e.code === "Space") {
    // Prevent page scroll
    e.preventDefault();

    // Avoid repeated triggers while key is held
    if (spaceHeld) return;

    spaceHeld = true;

    // Only start if game is active
    if (!gameState || gameState.isGameOver) {
      setStatus("Start a game first.", true);
      return;
    }

    startListening();
  }
});

document.addEventListener("keyup", e => {
  if (e.code === "Space") {
    e.preventDefault();

    spaceHeld = false;
    stopListening();
  }
});
// ===============================
// BUTTONS
// ===============================
document.getElementById("end-btn").addEventListener("click", endGame);

const readMissedBtn = document.getElementById("read-missed-btn");
if (readMissedBtn) {
  readMissedBtn.addEventListener("click", readMissedWordsAloud);
}

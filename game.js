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
// VOICE CONTROL HELPERS
// ===============================
function startListening() {
  if (!gameState || gameState.isGameOver) {
    setStatus("Start a game first.", true);
    return;
  }

  setStatus("Listening...");
  
  Speech.startListening(text => {
    // For now, treat spoken text as a guess
    handleGuess(text);
  });
}

function stopListening() {
  Speech.stopListening();
  setStatus("Stopped listening.");
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
// UPDATE MISSED WORDS
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
// READ MISSED WORDS (CHAINED)
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
    Speech.speak("You found all words.");
    return;
  }

  const chunkSize = 5;
  let index = 0;

  function speakNext() {
    if (index >= missedWords.length) return;

    const chunk = missedWords.slice(index, index + chunkSize);
    index += chunkSize;

    Speech.speak(chunk.join(", "), speakNext);
  }

  Speech.speak(`You missed ${missedWords.length} words.`, speakNext);
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

    if (i === gameState.puzzle.centerIndex) {
      cell.classList.add("center");
    }

    cell.textContent = ch.toUpperCase();
    grid.appendChild(cell);
  });

  document.getElementById("p1-score").textContent =
    `${gameState.players[0].name}: ${gameState.players[0].score}`;
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

  const player = gameState.players[0];
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

  updateMissedWordsUI(missed);

  // Chain speech
  Speech.speak(summary, () => {
    readMissedWordsAloud();
  });
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
// BUTTONS
// ===============================
document.getElementById("end-btn").addEventListener("click", endGame);

const readMissedBtn = document.getElementById("read-missed-btn");
if (readMissedBtn) {
  readMissedBtn.addEventListener("click", readMissedWordsAloud);
}

// ===============================
// KEYBOARD SHORTCUTS
// ===============================
document.addEventListener("keydown", e => {
  if (e.key === "1") {
    e.preventDefault();
    document.getElementById("start-btn")?.click();
  }

  if (e.key === "2") {
    e.preventDefault();
    endGame();
  }
});

// ===============================
// PUSH-TO-TALK (SPACE BAR)
// ===============================
let spaceHeld = false;

document.addEventListener("keydown", e => {
  if (e.code === "Space" && e.target.id !== "typed-word") {
    e.preventDefault();

    if (spaceHeld) return;
    spaceHeld = true;

    if (!gameState || gameState.isGameOver) {
      setStatus("Start a game first.", true);
      return;
    }

    startListening();
  }
});

document.addEventListener("keyup", e => {
  if (e.code === "Space" && e.target.id !== "typed-word") {
    e.preventDefault();
    spaceHeld = false;
    stopListening();
  }
});

// ===============================
// speech.js — Push-to-Talk Mode
// ===============================

const Speech = (() => {

  let recognition = null;
  let isListening = false;
  let isSpeaking = false;

  // -----------------------------
  // Text-to-Speech
  // -----------------------------
  function speak(text) {
    if (!window.speechSynthesis) return;

    isSpeaking = true;

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 2.0;
    utter.pitch = 1;
    utter.volume = 1;

    utter.onend = () => {
      isSpeaking = false;
    };

    speechSynthesis.speak(utter);
  }

  // -----------------------------
  // Start recognition (one-shot)
  // -----------------------------
  function startRecognition(callback) {
    const SpeechRec =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRec) {
      speak("Speech recognition is not supported in this browser.");
      return;
    }

    recognition = new SpeechRec();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;   // ⭐ one-shot mode

    recognition.onresult = event => {
      const text = event.results[0][0].transcript.toLowerCase();
      callback(text);
    };

    recognition.onerror = event => {
      console.warn("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      isListening = false;
    };

    try {
      recognition.start();
      isListening = true;
      speak("Listening.");
    } catch (e) {
      console.warn("Recognition start error:", e);
    }
  }

  // -----------------------------
  // Stop recognition
  // -----------------------------
  function stopRecognition() {
    if (recognition) {
      recognition.onend = null;
      recognition.stop();
      recognition = null;
    }
    isListening = false;
  }


// -----------------------------
// Push-to-Talk API
// -----------------------------
function pushToTalk(callback) {
  document.addEventListener("keydown", e => {
    if (e.code === "Space" && !isListening && !isSpeaking) {
      startRecognition(callback);
    }
  });

  document.addEventListener("keyup", e => {
    if (e.code === "Space") {
      stopRecognition();
    }
  });
}

return {
  speak,
  pushToTalk,
  stopListening: stopRecognition   // ⭐ ADD THIS
};
})();



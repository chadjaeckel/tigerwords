// ===============================
// speech.js (Improved)
// Supports speech chaining + clean listening
// ===============================

const Speech = (() => {
  let recognition = null;
  let isListening = false;
  let isSpeaking = false;

  // ===============================
  // SPEAK (WITH CALLBACK SUPPORT)
  // ===============================
  function speak(text, onEnd) {
    if (!window.speechSynthesis) return;

    // Stop any current speech before starting new
    speechSynthesis.cancel();

    isSpeaking = true;

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 2.0;
    utter.pitch = 1;
    utter.volume = 1;

    utter.onend = () => {
      isSpeaking = false;

      // Run next step if provided
      if (typeof onEnd === "function") {
        onEnd();
      }
    };

    utter.onerror = () => {
      isSpeaking = false;
      console.warn("Speech synthesis error.");
    };

    speechSynthesis.speak(utter);
  }

  // ===============================
  // START LISTENING
  // ===============================
  function startListening(callback) {
    const SpeechRec =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRec) {
      speak("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) return;

    recognition = new SpeechRec();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = event => {
      const text = event.results[0][0].transcript.toLowerCase();

      if (typeof callback === "function") {
        callback(text);
      }
    };

    recognition.onerror = event => {
      console.warn("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      isListening = false;
      recognition = null;
    };

    try {
      recognition.start();
      isListening = true;

      speak("Listening.");
    } catch (error) {
      console.warn("Recognition start error:", error);
    }
  }

  // ===============================
  // STOP LISTENING
  // ===============================
  function stopListening() {
    if (recognition) {
      recognition.stop();
      recognition = null;
    }

    isListening = false;
  }

  // ===============================
  // STOP SPEAKING (NEW FEATURE)
  // ===============================
  function stopSpeaking() {
    if (window.speechSynthesis) {
      speechSynthesis.cancel();
    }

    isSpeaking = false;
  }

  // ===============================
  // STATE HELPERS
  // ===============================
  function getIsListening() {
    return isListening;
  }

  function getIsSpeaking() {
    return isSpeaking;
  }

  // ===============================
  // PUBLIC API
  // ===============================
  return {
    speak,
    startListening,
    stopListening,
    stopSpeaking,
    getIsListening,
    getIsSpeaking
  };
})();

// ===============================
// speech.js
// ===============================

const Speech = (() => {
  let recognition = null;
  let isListening = false;
  let isSpeaking = false;

  function speak(text) {
    if (!window.speechSynthesis) return;

    speechSynthesis.cancel();

    isSpeaking = true;

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 2.0;
    utter.pitch = 1;
    utter.volume = 1;

    utter.onend = () => {
      isSpeaking = false;
    };

    utter.onerror = () => {
      isSpeaking = false;
    };

    speechSynthesis.speak(utter);
  }

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
      callback(text);
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

  function stopListening() {
    if (recognition) {
      recognition.stop();
      recognition = null;
    }

    isListening = false;
  }

  return {
    speak,
    startListening,
    stopListening
  };
})();

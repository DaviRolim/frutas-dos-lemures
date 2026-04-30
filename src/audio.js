const DEFAULT_RATE = 0.82;

export function createSpeechSystem({
  synth = globalThis.__speechSynthesisTestDouble || globalThis.speechSynthesis,
  Utterance = globalThis.SpeechSynthesisUtterance,
  voiceURI
} = {}) {
  function chooseVoice() {
    if (!synth?.getVoices) {
      return null;
    }

    const voices = synth.getVoices();
    return (
      voices.find((voice) => voice.voiceURI === voiceURI) ||
      voices.find((voice) => voice.lang?.toLowerCase().startsWith("en")) ||
      voices[0] ||
      null
    );
  }

  function speak(text, { lang = "en-US", rate = DEFAULT_RATE, pitch = 1.08 } = {}) {
    if (!synth || typeof Utterance !== "function") {
      return false;
    }

    try {
      synth.cancel?.();
      const utterance = new Utterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      const voice = chooseVoice();
      if (voice) {
        utterance.voice = voice;
      }
      synth.speak(utterance);
      return true;
    } catch {
      return false;
    }
  }

  return { speak };
}

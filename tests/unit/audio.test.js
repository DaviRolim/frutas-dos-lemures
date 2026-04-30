import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createSpeechSystem } from "../../src/audio.js";

describe("speech system", () => {
  it("speaks with an English voice when available", () => {
    const spoken = [];
    const synth = {
      cancel() {
        spoken.push("cancel");
      },
      getVoices() {
        return [
          { voiceURI: "pt", lang: "pt-BR" },
          { voiceURI: "en", lang: "en-US" }
        ];
      },
      speak(utterance) {
        spoken.push(utterance);
      }
    };
    const Utterance = class SpeechSynthesisUtterance {
      constructor(text) {
        this.text = text;
      }
    };

    const speech = createSpeechSystem({ synth, Utterance });
    assert.equal(speech.speak("Find red"), true);
    assert.equal(spoken[1].text, "Find red");
    assert.equal(spoken[1].voice.voiceURI, "en");
  });

  it("does not throw when browser speech refuses playback", () => {
    const Utterance = class SpeechSynthesisUtterance {
      constructor(text) {
        this.text = text;
      }
    };
    const speech = createSpeechSystem({
      synth: {
        getVoices() {
          return [];
        },
        speak() {
          throw new Error("speech unavailable");
        }
      },
      Utterance
    });

    assert.equal(speech.speak("Find red"), false);
  });
});

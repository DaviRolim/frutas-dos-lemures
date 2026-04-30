import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createAudioSystem } from "../../src/audio.js";

describe("audio system", () => {
  it("plays clips through the backend", async () => {
    const played = [];
    const audio = createAudioSystem({
      backend: createFakeBackend(played),
      clock: { now: () => 100 },
      maxClipMs: 40
    });

    await audio.play("./assets/voice/find-red-strawberry.mp3");
    assert.deepEqual(played, ["./assets/voice/find-red-strawberry.mp3"]);
  });

  it("waits for one clip to end before starting the next sequence clip", async () => {
    const played = [];
    const audio = createAudioSystem({
      backend: createFakeBackend(played, 8),
      clock: { now: () => performance.now() },
      maxClipMs: 80,
      sequenceGapMs: 1
    });

    await audio.playSequence(["yes-green-pear.mp3", "find-purple-grapes.mp3"]);
    assert.deepEqual(played, ["yes-green-pear.mp3", "find-purple-grapes.mp3"]);
  });
});

function createFakeBackend(played, endDelayMs = 0) {
  return {
    create(src) {
      const listeners = new Map();
      return {
        src,
        currentTime: 0,
        playing: false,
        addEventListener(event, listener) {
          listeners.set(event, listener);
        },
        removeEventListener(event) {
          listeners.delete(event);
        },
        pause() {
          this.playing = false;
        },
        async play() {
          played.push(src);
          this.playing = true;
          setTimeout(() => {
            this.playing = false;
            listeners.get("ended")?.();
          }, endDelayMs);
        }
      };
    }
  };
}

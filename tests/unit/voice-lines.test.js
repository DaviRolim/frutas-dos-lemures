import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ROUNDS } from "../../src/game-data.js";
import { getVoiceLine, VOICE_LINES } from "../../src/voice-lines.js";

describe("voice lines", () => {
  it("has find, yes, and try clips for every round", () => {
    assert.equal(VOICE_LINES.length, ROUNDS.length * 3);

    for (const round of ROUNDS) {
      const target = round.colorName === round.fruitName ? round.fruitName : `${round.colorName} ${round.fruitName}`;
      const capitalizedTarget = `${target.charAt(0).toUpperCase()}${target.slice(1)}`;
      assert.equal(getVoiceLine("find", round).text, `Find ${target}!`);
      assert.equal(getVoiceLine("yes", round).text, `Yes, correct! ${capitalizedTarget}!`);
      assert.equal(getVoiceLine("try", round).text, `Try ${round.colorName}.`);
    }
  });

  it("does not repeat color words inside find prompts", () => {
    for (const round of ROUNDS) {
      const text = getVoiceLine("find", round).text.toLowerCase();
      const matches = text.match(new RegExp(`\\b${round.colorName}\\b`, "g")) ?? [];
      assert.equal(matches.length, 1, text);
    }
  });
});

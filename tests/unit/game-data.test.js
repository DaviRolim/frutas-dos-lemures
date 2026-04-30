import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getChoices, getNextRoundIndex, getRound, LEMURS, ROUNDS } from "../../src/game-data.js";

describe("game data", () => {
  it("has one playable round per target color", () => {
    assert.equal(ROUNDS.length, 5);
    assert.deepEqual(
      ROUNDS.map((round) => round.colorName),
      ["red", "yellow", "green", "purple", "orange"]
    );
  });

  it("returns four choices with exactly one correct fruit", () => {
    for (let index = 0; index < ROUNDS.length; index += 1) {
      const choices = getChoices(index);
      assert.equal(choices.length, LEMURS.length);
      assert.equal(choices.filter((choice) => choice.isCorrect).length, 1);
      assert.equal(choices.find((choice) => choice.isCorrect).id, getRound(index).id);
    }
  });

  it("wraps the round index", () => {
    assert.equal(getNextRoundIndex(0), 1);
    assert.equal(getNextRoundIndex(ROUNDS.length - 1), 0);
  });
});

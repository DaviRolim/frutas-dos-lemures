import { ROUNDS } from "./game-data.js";

export const VOICE_LINE_TYPES = ["find", "yes", "try"];

export const VOICE_LINES = ROUNDS.flatMap((round) => [
  {
    id: voiceLineId("find", round),
    type: "find",
    roundId: round.id,
    text: `Find ${targetPhrase(round)}!`,
    path: `./assets/voice/${voiceLineId("find", round)}.mp3`
  },
  {
    id: voiceLineId("yes", round),
    type: "yes",
    roundId: round.id,
    text: `Yes, correct! ${capitalize(targetPhrase(round))}!`,
    path: `./assets/voice/${voiceLineId("yes", round)}.mp3`
  },
  {
    id: voiceLineId("try", round),
    type: "try",
    roundId: round.id,
    text: `Try ${round.colorName}.`,
    path: `./assets/voice/${voiceLineId("try", round)}.mp3`
  }
]);

export function getVoiceLine(type, round) {
  const line = VOICE_LINES.find((item) => item.type === type && item.roundId === round.id);
  if (!line) {
    throw new Error(`Missing voice line for ${type}:${round.id}`);
  }
  return line;
}

function voiceLineId(type, round) {
  return `${type}-${round.colorName}-${round.fruitName}`.replace(/\s+/g, "-").toLowerCase();
}

function targetPhrase(round) {
  if (round.colorName.toLowerCase() === round.fruitName.toLowerCase()) {
    return round.fruitName;
  }
  return `${round.colorName} ${round.fruitName}`;
}

function capitalize(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export const ROUNDS = [
  {
    id: "red",
    colorName: "red",
    portugueseColor: "vermelho",
    prompt: "Find red",
    fruitId: "strawberry",
    fruitName: "strawberry",
    portugueseFruit: "morango",
    hex: "#e33a4f"
  },
  {
    id: "yellow",
    colorName: "yellow",
    portugueseColor: "amarelo",
    prompt: "Find yellow",
    fruitId: "banana",
    fruitName: "banana",
    portugueseFruit: "banana",
    hex: "#ffd552"
  },
  {
    id: "green",
    colorName: "green",
    portugueseColor: "verde",
    prompt: "Find green",
    fruitId: "pear",
    fruitName: "pear",
    portugueseFruit: "pera",
    hex: "#73b95d"
  },
  {
    id: "purple",
    colorName: "purple",
    portugueseColor: "roxo",
    prompt: "Find purple",
    fruitId: "grapes",
    fruitName: "grapes",
    portugueseFruit: "uva",
    hex: "#8e5fd3"
  },
  {
    id: "orange",
    colorName: "orange",
    portugueseColor: "laranja",
    prompt: "Find orange",
    fruitId: "orange",
    fruitName: "orange",
    portugueseFruit: "laranja",
    hex: "#f38a3c"
  }
];

export const LEMURS = [
  { id: "luma", name: "Luma", x: 18, y: 24, pose: "reach" },
  { id: "kiko", name: "Kiko", x: 38, y: 48, pose: "sit" },
  { id: "mimi", name: "Mimi", x: 60, y: 24, pose: "wave" },
  { id: "tito", name: "Tito", x: 80, y: 48, pose: "sit" }
];

export function getRound(index, rounds = ROUNDS) {
  return rounds[index % rounds.length];
}

export function getChoices(roundIndex, rounds = ROUNDS, lemurs = LEMURS) {
  const correct = getRound(roundIndex, rounds);
  const start = roundIndex % rounds.length;
  const distractors = rounds
    .filter((round) => round.id !== correct.id)
    .slice(start)
    .concat(rounds.filter((round) => round.id !== correct.id).slice(0, start))
    .slice(0, lemurs.length - 1);

  return [correct, ...distractors]
    .map((round, index) => ({
      ...round,
      lemur: lemurs[(index + roundIndex) % lemurs.length],
      isCorrect: round.id === correct.id
    }))
    .sort((a, b) => a.lemur.x - b.lemur.x);
}

export function getNextRoundIndex(currentIndex, totalRounds = ROUNDS.length) {
  return (currentIndex + 1) % totalRounds;
}

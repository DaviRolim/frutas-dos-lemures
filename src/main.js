import "./styles.css";
import { createAudioSystem, createBrowserBackend, createBrowserClock } from "./audio.js";
import { getChoices, getNextRoundIndex, getRound, ROUNDS } from "./game-data.js";
import { getVoiceLine, VOICE_LINES } from "./voice-lines.js";

const app = document.getElementById("app");
const audio = createAudioSystem({
  backend: createBrowserBackend(),
  clock: createBrowserClock()
});
audio.preload(VOICE_LINES.map((line) => line.path));

let roundIndex = 0;
let score = 0;
let locked = false;
let turnId = 0;

function fruitSvg(choice) {
  const label = choice.fruitName;

  if (choice.fruitId === "banana") {
    return `
      <svg class="fruit-svg" viewBox="0 0 120 120" aria-hidden="true">
        <path d="M31 30c16 41 38 57 66 45-16 24-60 22-82-25 7-1 11-9 16-20Z" fill="${choice.hex}" />
        <path d="M27 29c6 10 11 14 18 15" fill="none" stroke="#8b5a24" stroke-width="8" stroke-linecap="round" />
        <path d="M89 78c7 0 12-3 16-9" fill="none" stroke="#8b5a24" stroke-width="7" stroke-linecap="round" />
      </svg>
      <span>${label}</span>
    `;
  }

  if (choice.fruitId === "grapes") {
    return `
      <svg class="fruit-svg" viewBox="0 0 120 120" aria-hidden="true">
        <path d="M67 23c8-12 19-11 29-6-11 1-19 6-23 17Z" fill="#5aa064" />
        <g fill="${choice.hex}">
          <circle cx="45" cy="43" r="15" /><circle cx="67" cy="43" r="15" />
          <circle cx="56" cy="62" r="15" /><circle cx="79" cy="62" r="15" />
          <circle cx="44" cy="80" r="15" /><circle cx="68" cy="82" r="15" />
        </g>
      </svg>
      <span>${label}</span>
    `;
  }

  if (choice.fruitId === "strawberry") {
    return `
      <svg class="fruit-svg" viewBox="0 0 120 120" aria-hidden="true">
        <path d="M60 99C25 74 25 33 60 38c35-5 35 36 0 61Z" fill="${choice.hex}" />
        <path d="M39 38c8-16 34-16 42 0-18 7-24 7-42 0Z" fill="#5aa064" />
        <g fill="#ffe9b8"><circle cx="49" cy="57" r="3" /><circle cx="68" cy="58" r="3" /><circle cx="58" cy="75" r="3" /></g>
      </svg>
      <span>${label}</span>
    `;
  }

  if (choice.fruitId === "pear") {
    return `
      <svg class="fruit-svg" viewBox="0 0 120 120" aria-hidden="true">
        <path d="M61 31c15 0 17 15 13 28 17 8 22 42-14 42S29 67 46 59c-4-13 0-28 15-28Z" fill="${choice.hex}" />
        <path d="M63 30c4-12 11-17 22-17-4 11-12 16-22 17Z" fill="#5aa064" />
        <path d="M60 31c2-9 1-15-4-21" fill="none" stroke="#8b5a24" stroke-width="6" stroke-linecap="round" />
      </svg>
      <span>${label}</span>
    `;
  }

  return `
    <svg class="fruit-svg" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="63" r="37" fill="${choice.hex}" />
      <path d="M63 27c6-12 16-17 29-12-6 10-16 15-29 12Z" fill="#5aa064" />
      <path d="M59 28c1-10-2-16-8-21" fill="none" stroke="#8b5a24" stroke-width="6" stroke-linecap="round" />
    </svg>
    <span>${label}</span>
  `;
}

function lemurSvg(choice) {
  const { pose } = choice.lemur;
  const armWave = pose === "wave" ? "M72 58c16-14 24-17 31-10" : "M72 61c17 7 25 16 25 28";
  const armReach = pose === "reach" ? "M48 58c-20-12-28-12-35 0" : "M48 61c-17 7-25 16-25 28";

  return `
    <svg class="lemur-svg" viewBox="0 0 140 148" aria-hidden="true">
      <path class="tail" d="M100 94c42-18 38-68 4-72-22-2-33 13-25 26 8 12 28 7 30-8" />
      <ellipse cx="63" cy="86" rx="35" ry="42" fill="#8d8b83" />
      <ellipse cx="63" cy="94" rx="23" ry="30" fill="#f3ead7" />
      <path d="${armReach}" fill="none" stroke="#67645f" stroke-width="13" stroke-linecap="round" />
      <path d="${armWave}" fill="none" stroke="#67645f" stroke-width="13" stroke-linecap="round" />
      <circle cx="63" cy="43" r="31" fill="#8d8b83" />
      <circle cx="49" cy="38" r="10" fill="#f3ead7" />
      <circle cx="77" cy="38" r="10" fill="#f3ead7" />
      <circle cx="49" cy="39" r="4" fill="#202020" />
      <circle cx="77" cy="39" r="4" fill="#202020" />
      <ellipse cx="63" cy="54" rx="14" ry="10" fill="#f3ead7" />
      <circle cx="63" cy="51" r="4" fill="#202020" />
      <path d="M55 59c5 5 12 5 17 0" fill="none" stroke="#202020" stroke-width="3" stroke-linecap="round" />
      <path d="M41 17c-11 3-17 10-17 21 8-5 15-6 24-4Z" fill="#6f6d67" />
      <path d="M85 17c11 3 17 10 17 21-8-5-15-6-24-4Z" fill="#6f6d67" />
    </svg>
  `;
}

function render() {
  const round = getRound(roundIndex);
  const choices = getChoices(roundIndex);
  const progress = ROUNDS.map((item, index) => {
    const active = index === roundIndex ? "is-active" : "";
    const done = index < score ? "is-done" : "";
    return `<span class="progress-dot ${active} ${done}" style="--dot:${item.hex}" aria-hidden="true"></span>`;
  }).join("");

  app.innerHTML = `
    <section class="canopy" aria-label="Frutas dos Lemures Color Hunt">
      <div class="sky-band"></div>
      <header class="game-header">
        <div>
          <p class="kicker">Natan's Color Hunt</p>
          <h1>Frutas dos Lêmures</h1>
        </div>
        <button class="sound-button" type="button" data-action="repeat" aria-label="Repeat color">
          <span aria-hidden="true">Listen</span>
        </button>
      </header>

      <section class="prompt-card" style="--target:${round.hex}">
        <div class="target-orb" aria-hidden="true"></div>
        <div>
          <p class="prompt-en">${round.prompt}</p>
          <p class="prompt-pt">${round.portugueseColor} • ${round.portugueseFruit}</p>
        </div>
      </section>

      <section class="jungle-stage" aria-label="Choose the fruit that matches the color">
        <div class="vine vine-one"></div>
        <div class="vine vine-two"></div>
        ${choices
          .map(
            (choice) => `
              <button
                class="lemur-choice"
                type="button"
                data-choice="${choice.id}"
                data-correct="${choice.isCorrect}"
                style="--x:${choice.lemur.x}; --y:${choice.lemur.y}; --fruit:${choice.hex};"
                aria-label="${choice.lemur.name} has ${choice.colorName} ${choice.fruitName}"
              >
                ${lemurSvg(choice)}
                <span class="fruit-badge">${fruitSvg(choice)}</span>
              </button>
            `
          )
          .join("")}
      </section>

      <footer class="game-footer">
        <div class="progress" aria-label="Progress">${progress}</div>
        <p class="status" data-status>${score === ROUNDS.length ? "Great job, Natan!" : "Tap a fruit."}</p>
      </footer>
    </section>
  `;
}

function sayRound() {
  const round = getRound(roundIndex);
  audio.play(getVoiceLine("find", round).path);
}

async function advanceAfterCorrect(round, nextIndex, token) {
  await audio.playAndWait(getVoiceLine("yes", round).path);
  if (token !== turnId) {
    return;
  }

  await delay(260);
  if (token !== turnId) {
    return;
  }

  roundIndex = nextIndex;
  if (score === ROUNDS.length) {
    score = 0;
  }
  locked = false;
  render();
  audio.play(getVoiceLine("find", getRound(roundIndex)).path);
}

function handleChoice(button) {
  if (locked) {
    return;
  }

  const round = getRound(roundIndex);
  const isCorrect = button.dataset.correct === "true";
  button.classList.add(isCorrect ? "is-correct" : "try-again");

  if (!isCorrect) {
    app.querySelector("[data-status]").textContent = `Try ${round.colorName}.`;
    audio.play(getVoiceLine("try", round).path);
    window.setTimeout(() => button.classList.remove("try-again"), 700);
    return;
  }

  locked = true;
  const token = ++turnId;
  const nextIndex = getNextRoundIndex(roundIndex);
  score = Math.min(score + 1, ROUNDS.length);
  app.querySelector("[data-status]").textContent = `Yes, correct! ${round.colorName} ${round.fruitName}.`;
  advanceAfterCorrect(round, nextIndex, token);
}

app.addEventListener("click", (event) => {
  const repeatButton = event.target.closest("[data-action='repeat']");
  if (repeatButton) {
    sayRound();
    return;
  }

  const choice = event.target.closest(".lemur-choice");
  if (choice) {
    handleChoice(choice);
  }
});

render();

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // Dev and file previews can refuse service worker registration.
    });
  });
}

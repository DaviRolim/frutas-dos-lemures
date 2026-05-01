import "./styles.css";
import lemurSpriteUrl from "../assets/images/lemur-guide.png";
import natanPointerUrl from "../assets/images/natan-pointer.png";
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
let idleHintTimer = null;

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

function lemurArt(choice) {
  return `
    <span class="lemur-lift" aria-hidden="true">
      <img
        class="lemur-art lemur-pose-${choice.lemur.pose}"
        src="${lemurSpriteUrl}"
        alt=""
        draggable="false"
      />
    </span>
  `;
}

function guideArt() {
  return `<img class="guide-art" src="${natanPointerUrl}" alt="" draggable="false" />`;
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
        <div class="leaf-drift" aria-hidden="true">
          <span style="--left:7%; --delay:-1.4s; --size:18px; --spin:23deg"></span>
          <span style="--left:28%; --delay:-4.2s; --size:14px; --spin:-18deg"></span>
          <span style="--left:53%; --delay:-2.7s; --size:22px; --spin:34deg"></span>
          <span style="--left:81%; --delay:-5.5s; --size:16px; --spin:-28deg"></span>
        </div>
        <div class="vine vine-one"></div>
        <div class="vine vine-two"></div>
        <div class="celebration-layer" data-celebration aria-hidden="true"></div>
        <span class="guide-pointer" data-guide-pointer aria-hidden="true"></span>
        <div class="guide-character" data-guide aria-hidden="true">
          ${guideArt()}
          <span class="guide-bubble" data-guide-bubble>Tap the color!</span>
        </div>
        ${choices
          .map(
            (choice, index) => `
              <button
                class="lemur-choice"
                type="button"
                data-choice="${choice.id}"
                data-correct="${choice.isCorrect}"
                data-fruit="${choice.fruitName}"
                data-color="${choice.colorName}"
                style="--x:${choice.lemur.x}%; --y:${choice.lemur.y}%; --fruit:${choice.hex}; --bob-delay:${index * -220}ms;"
                aria-label="${choice.lemur.name} has ${choice.colorName} ${choice.fruitName}"
              >
                ${lemurArt(choice)}
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
  resetIdleHint();
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

function pointGuideAt(button, message, isCorrect) {
  const stage = app.querySelector(".jungle-stage");
  const guide = app.querySelector("[data-guide]");
  const pointer = app.querySelector("[data-guide-pointer]");
  const bubble = app.querySelector("[data-guide-bubble]");
  if (!stage || !guide || !pointer || !bubble) {
    return;
  }

  const stageRect = stage.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();
  const guideRect = guide.getBoundingClientRect();
  const startX = guideRect.left + guideRect.width * 0.9 - stageRect.left;
  const startY = guideRect.top + guideRect.height * 0.27 - stageRect.top;
  const endX = buttonRect.left + buttonRect.width * 0.54 - stageRect.left;
  const endY = buttonRect.top + buttonRect.height * 0.42 - stageRect.top;
  const dx = endX - startX;
  const dy = endY - startY;

  pointer.style.setProperty("--ray-left", `${startX}px`);
  pointer.style.setProperty("--ray-top", `${startY}px`);
  pointer.style.setProperty("--ray-width", `${Math.max(42, Math.hypot(dx, dy) - 24)}px`);
  pointer.style.setProperty("--ray-angle", `${Math.atan2(dy, dx)}rad`);
  pointer.classList.add("is-visible");
  bubble.textContent = message;
  guide.classList.toggle("is-cheering", isCorrect);
  guide.classList.add("is-pointing");
}

function celebrateAt(button, round) {
  const layer = app.querySelector("[data-celebration]");
  const stage = app.querySelector(".jungle-stage");
  if (!layer || !stage) {
    return;
  }

  const stageRect = stage.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();
  const x = buttonRect.left + buttonRect.width * 0.5 - stageRect.left;
  const y = buttonRect.top + buttonRect.height * 0.3 - stageRect.top;
  const colors = [round.hex, "#ffde6b", "#4db6ac", "#fff8df", "#ff7a59"];
  const pieces = Array.from({ length: 28 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 28;
    const distance = 58 + (index % 5) * 13;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    const color = colors[index % colors.length];
    const shape = ["✦", "●", "◆", "✹", "▲"][index % 5];
    return `<span class="confetti-piece" style="--x:${x}px; --y:${y}px; --tx:${tx}px; --ty:${ty}px; --c:${color}; --d:${index * 18}ms">${shape}</span>`;
  }).join("");

  layer.innerHTML = `<span class="success-ripple" style="--x:${x}px; --y:${y}px"></span><div class="celebration-pop" style="--x:${x}px; --y:${y}px">Yay!</div>${pieces}`;
  window.setTimeout(() => {
    if (layer) {
      layer.innerHTML = "";
    }
  }, 1200);
}

function handleChoice(button) {
  if (locked) {
    return;
  }
  resetIdleHint();

  const round = getRound(roundIndex);
  const isCorrect = button.dataset.correct === "true";
  button.classList.add(isCorrect ? "is-correct" : "try-again");

  if (!isCorrect) {
    app.querySelector("[data-status]").textContent = `Try ${round.colorName}.`;
    pointGuideAt(button, `Try ${round.colorName}!`, false);
    audio.play(getVoiceLine("try", round).path);
    window.setTimeout(() => button.classList.remove("try-again"), 700);
    return;
  }

  locked = true;
  const token = ++turnId;
  const nextIndex = getNextRoundIndex(roundIndex);
  score = Math.min(score + 1, ROUNDS.length);
  app.querySelector("[data-status]").textContent = `Yes, correct! ${round.colorName} ${round.fruitName}.`;
  pointGuideAt(button, "Yay, Natan!", true);
  celebrateAt(button, round);
  advanceAfterCorrect(round, nextIndex, token);
}

function resetIdleHint() {
  window.clearTimeout(idleHintTimer);
  if (locked) {
    return;
  }
  idleHintTimer = window.setTimeout(pulseCorrectChoice, 2400);
}

function pulseCorrectChoice() {
  if (locked) {
    return;
  }

  const correctChoice = app.querySelector(".lemur-choice[data-correct='true']");
  if (!correctChoice) {
    return;
  }

  correctChoice.classList.remove("pulse-hint");
  void correctChoice.offsetWidth;
  correctChoice.classList.add("pulse-hint");
  window.setTimeout(() => correctChoice.classList.remove("pulse-hint"), 1450);
  idleHintTimer = window.setTimeout(pulseCorrectChoice, 3600);
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

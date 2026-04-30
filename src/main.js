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

function guideSvg() {
  return `
    <svg class="guide-svg" viewBox="0 0 190 210" aria-hidden="true">
      <path class="guide-tail" d="M138 143c48-17 45-79 6-86-27-5-44 13-36 31 8 17 35 12 39-10" />
      <ellipse cx="87" cy="128" rx="46" ry="55" fill="#b88755" />
      <ellipse cx="89" cy="139" rx="30" ry="39" fill="#ffe5ba" />
      <path class="guide-arm guide-arm-left" d="M54 116c-26 14-37 31-35 52" />
      <path class="guide-arm guide-arm-right" d="M121 111c27-15 41-33 53-58" />
      <circle cx="88" cy="67" r="43" fill="#b88755" />
      <path d="M51 42c-16 1-28 10-34 27 15-5 28-3 39 7Z" fill="#7f5a3d" />
      <path d="M125 42c16 1 28 10 34 27-15-5-28-3-39 7Z" fill="#7f5a3d" />
      <ellipse cx="88" cy="77" rx="29" ry="24" fill="#ffe5ba" />
      <circle cx="73" cy="62" r="12" fill="#fff8df" />
      <circle cx="104" cy="62" r="12" fill="#fff8df" />
      <circle cx="73" cy="64" r="5" fill="#18362c" />
      <circle cx="104" cy="64" r="5" fill="#18362c" />
      <ellipse cx="88" cy="78" rx="11" ry="8" fill="#543728" />
      <path d="M76 91c9 8 20 8 29 0" fill="none" stroke="#543728" stroke-width="5" stroke-linecap="round" />
      <path d="M66 30c14-8 32-8 45 0" fill="none" stroke="#ffde6b" stroke-width="10" stroke-linecap="round" />
      <path d="M51 124c25 20 51 21 77 1" fill="none" stroke="#4db6ac" stroke-width="13" stroke-linecap="round" />
    </svg>
  `;
}

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
        <div class="celebration-layer" data-celebration aria-hidden="true"></div>
        <span class="guide-pointer" data-guide-pointer aria-hidden="true"></span>
        <div class="guide-character" data-guide aria-hidden="true">
          ${guideSvg()}
          <span class="guide-bubble" data-guide-bubble>Tap the color!</span>
        </div>
        ${choices
          .map(
            (choice) => `
              <button
                class="lemur-choice"
                type="button"
                data-choice="${choice.id}"
                data-correct="${choice.isCorrect}"
                data-fruit="${choice.fruitName}"
                data-color="${choice.colorName}"
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
  const startX = guideRect.left + guideRect.width * 0.73 - stageRect.left;
  const startY = guideRect.top + guideRect.height * 0.36 - stageRect.top;
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
  const pieces = Array.from({ length: 18 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 18;
    const distance = 58 + (index % 5) * 13;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    const color = colors[index % colors.length];
    const shape = index % 3 === 0 ? "★" : index % 3 === 1 ? "●" : "◆";
    return `<span class="confetti-piece" style="--x:${x}px; --y:${y}px; --tx:${tx}px; --ty:${ty}px; --c:${color}; --d:${index * 18}ms">${shape}</span>`;
  }).join("");

  layer.innerHTML = `<div class="celebration-pop" style="--x:${x}px; --y:${y}px">Yay!</div>${pieces}`;
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

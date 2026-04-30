export function createAudioSystem({
  backend,
  clock,
  cooldownMs = 220,
  maxClipMs = 2800,
  sequenceGapMs = 260
}) {
  const cache = new Map();
  let currentSrc = null;
  let currentEl = null;
  let generation = 0;
  const lastPlayedAt = new Map();

  function getElement(src) {
    if (!cache.has(src)) {
      cache.set(src, backend.create(src));
    }
    return cache.get(src);
  }

  async function playClip(src, { wait = false, generationId = ++generation } = {}) {
    const now = clock.now();
    const last = lastPlayedAt.get(src) ?? -Infinity;
    if (currentSrc === src && now - last < cooldownMs) {
      return false;
    }

    if (currentEl && currentEl !== getElement(src) && currentEl.playing) {
      currentEl.pause();
    }

    const el = getElement(src);
    currentSrc = src;
    currentEl = el;
    el.currentTime = 0;
    lastPlayedAt.set(src, now);

    try {
      await el.play();
      if (wait) {
        await waitForClipEnd(el, maxClipMs);
      }
      return generationId === generation;
    } catch {
      return false;
    }
  }

  function play(src) {
    generation += 1;
    return playClip(src, { wait: false, generationId: generation });
  }

  function playAndWait(src) {
    generation += 1;
    return playClip(src, { wait: true, generationId: generation });
  }

  async function playSequence(srcs) {
    const sequenceGeneration = ++generation;
    for (const src of srcs) {
      if (sequenceGeneration !== generation) {
        return false;
      }

      await playClip(src, { wait: true, generationId: sequenceGeneration });
      if (sequenceGeneration !== generation) {
        return false;
      }

      await delay(sequenceGapMs);
    }

    return sequenceGeneration === generation;
  }

  function preload(srcs) {
    for (const src of srcs) {
      getElement(src);
    }
  }

  return { play, playAndWait, playSequence, preload };
}

export function createBrowserBackend() {
  return {
    create(src) {
      const el = new Audio(src);
      el.preload = "auto";
      el.playing = false;
      el.addEventListener("playing", () => {
        el.playing = true;
      });
      el.addEventListener("pause", () => {
        el.playing = false;
      });
      el.addEventListener("ended", () => {
        el.playing = false;
      });
      return el;
    }
  };
}

export function createBrowserClock() {
  return { now: () => performance.now() };
}

function waitForClipEnd(el, maxClipMs) {
  return new Promise((resolve) => {
    let settled = false;
    let timeoutId;

    function finish() {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutId);
      el.removeEventListener?.("ended", finish);
      el.removeEventListener?.("error", finish);
      resolve();
    }

    el.addEventListener?.("ended", finish, { once: true });
    el.addEventListener?.("error", finish, { once: true });
    timeoutId = setTimeout(finish, maxClipMs);
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

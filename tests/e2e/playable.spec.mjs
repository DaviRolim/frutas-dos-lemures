import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__played = [];
    window.Audio = class FakeAudio {
      constructor(src) {
        this.src = src;
        this.currentTime = 0;
        this.preload = "";
        this.playing = false;
        this.listeners = new Map();
      }

      addEventListener(event, listener) {
        this.listeners.set(event, listener);
      }

      removeEventListener(event) {
        this.listeners.delete(event);
      }

      pause() {
        this.playing = false;
        this.listeners.get("pause")?.();
      }

      async play() {
        window.__played.push(this.src);
        this.playing = true;
        this.listeners.get("playing")?.();
        window.setTimeout(() => {
          this.playing = false;
          this.listeners.get("ended")?.();
        }, 20);
      }
    };
  });
});

test("renders a playable color hunt", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Frutas dos Lêmures" })).toBeVisible();
  await expect(page.getByText("Find red")).toBeVisible();
  await expect(page.locator(".lemur-choice")).toHaveCount(4);
  await expect(page.getByRole("button", { name: /has red strawberry/i })).toBeVisible();
});

test("wrong choices nudge and the correct fruit advances the round", async ({ page }) => {
  await page.goto("/");

  await page.locator(".lemur-choice[data-correct='false']").first().click();
  await expect(page.locator("[data-status]")).toContainText("Try red.");

  await page.locator(".lemur-choice[data-correct='true']").click();
  await expect(page.locator("[data-status]")).toContainText("Yes, correct! red strawberry.");
  await expect(page.locator(".lemur-choice.is-correct")).toHaveCount(1);
  await expect(page.getByText("Find yellow")).toBeVisible({ timeout: 1400 });

  const played = await page.evaluate(() => window.__played);
  expect(played.some((src) => src.includes("try-red-strawberry.mp3"))).toBe(true);
  const successIndex = played.findIndex((src) => src.includes("yes-red-strawberry.mp3"));
  const nextPromptIndex = played.findIndex((src) => src.includes("find-yellow-banana.mp3"));
  expect(successIndex).toBeGreaterThanOrEqual(0);
  expect(nextPromptIndex).toBeGreaterThan(successIndex);
});

test("green pear success is followed by a single purple grapes prompt", async ({ page }) => {
  await page.goto("/");

  await page.locator(".lemur-choice[data-correct='true']").click();
  await expect(page.getByText("Find yellow")).toBeVisible({ timeout: 1400 });

  await page.locator(".lemur-choice[data-correct='true']").click();
  await expect(page.getByText("Find green")).toBeVisible({ timeout: 1400 });

  await page.locator(".lemur-choice[data-correct='true']").click();
  await expect(page.getByText("Find purple")).toBeVisible({ timeout: 1400 });

  const played = await page.evaluate(() => window.__played);
  const greenSuccessIndex = played.findIndex((src) => src.includes("yes-green-pear.mp3"));
  const purplePromptIndex = played.findIndex((src) => src.includes("find-purple-grapes.mp3"));
  expect(greenSuccessIndex).toBeGreaterThanOrEqual(0);
  expect(purplePromptIndex).toBeGreaterThan(greenSuccessIndex);
  expect(played.filter((src) => src.includes("find-purple-grapes.mp3"))).toHaveLength(1);
});

test("repeat button plays the ElevenLabs prompt", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Repeat color" }).click();
  const played = await page.evaluate(() => window.__played);
  expect(played.some((src) => src.includes("find-red-strawberry.mp3"))).toBe(true);
});

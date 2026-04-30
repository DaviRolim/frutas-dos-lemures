import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__spoken = [];
    window.__speechSynthesisTestDouble = {
      cancel() {},
      getVoices() {
        return [{ voiceURI: "test-en", lang: "en-US" }];
      },
      speak(utterance) {
        window.__spoken.push(utterance.text);
      }
    };
    window.SpeechSynthesisUtterance = class SpeechSynthesisUtterance {
      constructor(text) {
        this.text = text;
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
  await expect(page.locator("[data-status]")).toContainText("red. strawberry.");
  await expect(page.locator(".lemur-choice.is-correct")).toHaveCount(1);
  await expect(page.getByText("Find yellow")).toBeVisible({ timeout: 2200 });
});

test("repeat button speaks the English prompt", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Repeat color" }).click();
  const spoken = await page.evaluate(() => window.__spoken);
  expect(spoken.some((line) => line.includes("Find red"))).toBe(true);
});

import { test, expect, type Page } from "@playwright/test";
import type Phaser from "phaser";
import type { GameAudio } from "../../src/systems/Audio";

type Flight = Phaser.Scene & {
  state: string;
  audio: GameAudio;
};
async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const path = "/src/main.ts";
    const { game } = (await import(path)) as typeof import("../../src/main");
    const scene = game.scene.getScene("flight") as Phaser.Scene & {
      state: string;
      audio: {
        context?: AudioContext;
        voices: Set<OscillatorNode>;
        beat: number;
      };
    };
    return {
      state: scene.state,
      context: scene.audio.context?.state ?? "absent",
      voices: scene.audio.voices.size,
      beat: scene.audio.beat,
    };
  });
}

test("audio unlocks, plays, silences on pause, and resets on replay", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await expect.poll(async () => (await snapshot(page)).state).toBe("ready");
  expect((await snapshot(page)).context).toBe("absent");
  await page.keyboard.press("Enter", { delay: 100 });
  await expect.poll(async () => (await snapshot(page)).context).toBe("running");
  await page.keyboard.down("Space");
  await expect
    .poll(async () => (await snapshot(page)).voices)
    .toBeGreaterThan(0);
  await page.keyboard.up("Space");
  await page.evaluate(async () => {
    const path = "/src/main.ts";
    const { game } = (await import(path)) as typeof import("../../src/main");
    (game.scene.getScene("flight") as Flight).audio.startBoss();
  });
  await expect.poll(async () => (await snapshot(page)).beat).toBeGreaterThan(0);
  await page.keyboard.press("p", { delay: 100 });
  const paused = await snapshot(page);
  expect(paused.state).toBe("paused");
  expect(paused.voices).toBe(0);
  await page.waitForTimeout(350);
  expect((await snapshot(page)).beat).toBe(paused.beat);
  await page.keyboard.press("p", { delay: 100 });
  await expect
    .poll(async () => (await snapshot(page)).beat)
    .toBeGreaterThan(paused.beat);
  await page.evaluate(async () => {
    const path = "/src/main.ts";
    const { game } = (await import(path)) as typeof import("../../src/main");
    const scene = game.scene.getScene("flight") as Flight & {
      startRun(): void;
    };
    scene.startRun();
  });
  expect((await snapshot(page)).beat).toBe(0);
  expect(errors).toEqual([]);
});

test("accessible audio controls retain settings without launching the game", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await expect.poll(async () => (await snapshot(page)).state).toBe("ready");
  await page.getByRole("button", { name: "Mute audio", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Unmute audio" }),
  ).toHaveAttribute("aria-pressed", "true");
  const slider = page.getByLabel("Volume", { exact: true });
  await slider.fill("60");
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("61");
  await page.keyboard.press("Enter", { delay: 100 });
  expect((await snapshot(page)).state).toBe("ready");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Unmute audio" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(slider).toHaveValue("61");
});

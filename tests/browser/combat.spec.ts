import { expect, test, type Page } from "@playwright/test";
import type Phaser from "phaser";
import type { Enemies } from "../../src/systems/Enemies";
import type { Projectiles } from "../../src/systems/Projectiles";
import type { Waves } from "../../src/systems/Waves";

// Inspect the actual scene in Vite, without adding test controls to the game UI.
type Flight = Phaser.Scene & {
  player: Phaser.Physics.Arcade.Sprite;
  enemies: Enemies;
  bullets: Projectiles;
  hostileShots: Projectiles;
  waves: Waves;
  state: string;
  elapsed: number;
  score: number;
  lives: number;
  invincibleUntil: number;
  startRun(): void;
};

async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const path = "/src/main.ts";
    const { game } = (await import(path)) as typeof import("../../src/main");
    const scene = game.scene.getScene("flight") as Flight;
    return {
      state: scene.state,
      lives: scene.lives,
      score: scene.score,
      elapsed: scene.elapsed,
      enemies: scene.enemies.group.countActive(true),
      shots: scene.hostileShots.group.countActive(true),
      wave: scene.waves.number,
    };
  });
}

test("aimed attacks freeze on pause, respect invulnerability, and clear on retry", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForTimeout(300);
  await page.keyboard.press("Enter", { delay: 100 });
  await page.evaluate(async () => {
    const path = "/src/main.ts";
    const { game } = (await import(path)) as typeof import("../../src/main");
    const scene = game.scene.getScene("flight") as Flight;
    scene.enemies.spawn("gunner", scene.player.y, scene.elapsed - 1700, 2);
    const enemy =
      scene.enemies.group.getFirstAlive() as Phaser.Physics.Arcade.Sprite;
    enemy.setPosition(700, scene.player.y);
  });
  await expect
    .poll(async () => (await snapshot(page)).shots)
    .toBeGreaterThan(0);
  await page.keyboard.press("p", { delay: 100 });
  const paused = await snapshot(page);
  await page.waitForTimeout(500);
  expect(await snapshot(page)).toEqual(paused);
  await page.keyboard.press("p", { delay: 100 });
  await expect
    .poll(async () => (await snapshot(page)).lives, { timeout: 6000 })
    .toBe(2);
  await page.evaluate(async () => {
    const path = "/src/main.ts";
    const { game } = (await import(path)) as typeof import("../../src/main");
    const scene = game.scene.getScene("flight") as Flight;
    for (let i = 0; i < 3; i++)
      scene.hostileShots.fire(scene.player.x, scene.player.y, { x: 0, y: 0 });
  });
  await page.waitForTimeout(150);
  expect((await snapshot(page)).lives).toBe(2);
  // Deliver two further separated hits via real Arcade overlap handling.
  for (const lives of [1, 0]) {
    await page.evaluate(async () => {
      const path = "/src/main.ts";
      const { game } = (await import(path)) as typeof import("../../src/main");
      const scene = game.scene.getScene("flight") as Flight;
      scene.invincibleUntil = 0;
      scene.hostileShots.fire(scene.player.x, scene.player.y, { x: 0, y: 0 });
    });
    await expect.poll(async () => (await snapshot(page)).lives).toBe(lives);
  }
  expect((await snapshot(page)).state).toBe("over");
  await page.keyboard.press("Enter", { delay: 100 });
  expect(await snapshot(page)).toMatchObject({
    state: "playing",
    lives: 3,
    score: 0,
    shots: 0,
    enemies: 0,
    wave: 0,
  });
  expect(errors).toEqual([]);
});

test("guardians take five hits and recycled enemies reset their health", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForTimeout(300);
  const result = await page.evaluate(async () => {
    const path = "/src/main.ts";
    const { game } = (await import(path)) as typeof import("../../src/main");
    const scene = game.scene.getScene("flight") as Flight;
    scene.startRun();
    scene.enemies.spawn("guardian", 200, 0, 3);
    const enemy =
      scene.enemies.group.getFirstAlive() as Phaser.Physics.Arcade.Sprite;
    const rewards = Array.from({ length: 6 }, () => scene.enemies.hit(enemy));
    scene.enemies.spawn("gunner", 200, 0, 2);
    const recycled =
      scene.enemies.group.getFirstAlive() as Phaser.Physics.Arcade.Sprite;
    const recycledRewards = [
      scene.enemies.hit(recycled),
      scene.enemies.hit(recycled),
    ];
    for (let i = 0; i < 80; i++)
      scene.hostileShots.fire(400, 200, { x: -100, y: 0 });
    const count = scene.hostileShots.group.countActive(true);
    scene.hostileShots.group
      .getChildren()
      .forEach((child) =>
        (child as Phaser.Physics.Arcade.Sprite).setPosition(-50, 200),
      );
    scene.hostileShots.update();
    return {
      rewards,
      recycledRewards,
      reused: recycled === enemy,
      count,
      remaining: scene.hostileShots.group.countActive(true),
    };
  });
  expect(result).toEqual({
    rewards: [0, 0, 0, 0, 500, 0],
    recycledRewards: [0, 200],
    reused: true,
    count: 64,
    remaining: 0,
  });
});

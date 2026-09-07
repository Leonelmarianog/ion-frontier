import { test, expect, type Page } from "@playwright/test";
import type Phaser from "phaser";
import type { Boss } from "../../src/systems/Boss";
import type { StageProgress } from "../../src/game/stage";
import type { Projectiles } from "../../src/systems/Projectiles";
import type { Waves } from "../../src/systems/Waves";
import type { Enemies } from "../../src/systems/Enemies";
import type { WeaponLoadout } from "../../src/game/weapons";

type Flight = Phaser.Scene & {
  boss: Boss;
  stage: StageProgress;
  waves: Waves;
  enemies: Enemies;
  weapons: WeaponLoadout;
  bullets: Projectiles;
  hostileShots: Projectiles;
  player: Phaser.Physics.Arcade.Sprite;
  state: string;
  elapsed: number;
  invincibleUntil: number;
  lives: number;
  score: number;
  startRun(): void;
  update(time: number, delta: number): void;
};
async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const path = "/src/main.ts";
    const { game } = (await import(path)) as typeof import("../../src/main");
    const s = game.scene.getScene("flight") as Flight;
    return {
      phase: s.stage.phase,
      state: s.state,
      health: s.boss.health,
      active: s.boss.sprite.active,
      shots: s.hostileShots.group.countActive(true),
      elapsed: s.elapsed,
      score: s.score,
      wave: s.waves.number,
      lives: s.lives,
      level: s.weapons.spreadLevel,
    };
  });
}
async function approach(page: Page) {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForTimeout(300);
  return page.evaluate(async () => {
    const path = "/src/main.ts";
    const { game } = (await import(path)) as typeof import("../../src/main");
    const s = game.scene.getScene("flight") as Flight;
    s.startRun();
    // Simulate the real authored approach at fixed frames; only player damage is disabled.
    s.invincibleUntil = Infinity;
    for (
      let frame = 0;
      frame < 12000 && s.stage.phase === "approach";
      frame++
    ) {
      s.physics.world.step(1 / 60);
      s.physics.world.postUpdate();
      s.update(0, 1000 / 60);
    }
    return {
      phase: s.stage.phase,
      wave: s.waves.number,
      complete: s.waves.complete,
      enemies: s.enemies.group.countActive(true),
    };
  });
}

test("authored stage reaches boss, pauses attacks, awards victory once and replays", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  expect(await approach(page)).toEqual({
    phase: "warning",
    wave: 10,
    complete: true,
    enemies: 0,
  });
  await expect.poll(async () => (await snapshot(page)).active).toBe(true);
  // Entry shield prevents pre-firing from damaging the arriving boss.
  expect(
    await page.evaluate(async () => {
      const path = "/src/main.ts";
      const { game } = (await import(path)) as typeof import("../../src/main");
      const s = game.scene.getScene("flight") as Flight;
      s.boss.hit();
      return s.boss.health;
    }),
  ).toBe(100);
  await expect
    .poll(async () => (await snapshot(page)).shots, { timeout: 6000 })
    .toBeGreaterThan(0);
  await page.keyboard.press("p", { delay: 100 });
  const paused = await snapshot(page);
  await page.waitForTimeout(250);
  expect(await snapshot(page)).toEqual(paused);
  await page.keyboard.press("p", { delay: 100 });
  await page.screenshot({ path: "test-results/boss-fight.png" });
  // Resolve actual projectile overlaps in both phases, not a direct victory call.
  await page.evaluate(async () => {
    const path = "/src/main.ts";
    const { game } = (await import(path)) as typeof import("../../src/main");
    const s = game.scene.getScene("flight") as Flight;
    for (let hit = 0; hit < 50; hit++) {
      s.bullets.fire(s.boss.sprite.x, s.boss.sprite.y, { x: 0, y: 0 });
      s.physics.world.step(1 / 60);
      s.physics.world.postUpdate();
    }
  });
  expect((await snapshot(page)).health).toBe(50);
  await page.evaluate(async () => {
    const path = "/src/main.ts";
    const { game } = (await import(path)) as typeof import("../../src/main");
    const s = game.scene.getScene("flight") as Flight;
    for (let hit = 0; hit < 55 && s.state === "playing"; hit++) {
      s.bullets.fire(s.boss.sprite.x, s.boss.sprite.y, { x: 0, y: 0 });
      s.physics.world.step(1 / 60);
      s.physics.world.postUpdate();
    }
  });
  expect(await snapshot(page)).toMatchObject({
    state: "victory",
    phase: "complete",
    score: 8000,
    shots: 0,
    active: false,
  });
  const won = await snapshot(page);
  await page.waitForTimeout(200);
  expect(await snapshot(page)).toEqual(won);
  await page.screenshot({ path: "test-results/stage-victory.png" });
  await page.keyboard.press("Enter", { delay: 100 });
  expect(await snapshot(page)).toMatchObject({
    state: "playing",
    phase: "approach",
    wave: 0,
    score: 0,
    lives: 3,
    level: 0,
    active: false,
    shots: 0,
  });
  expect(errors).toEqual([]);
});

test("boss defeat retains game-over behavior and click retries from the first encounter", async ({
  page,
}) => {
  await approach(page);
  await expect
    .poll(async () => (await snapshot(page)).shots, { timeout: 10000 })
    .toBeGreaterThan(0);
  await page.evaluate(async () => {
    const path = "/src/main.ts";
    const { game } = (await import(path)) as typeof import("../../src/main");
    const s = game.scene.getScene("flight") as Flight;
    s.lives = 1;
    s.invincibleUntil = 0;
    s.hostileShots.fire(s.player.x, s.player.y, { x: 0, y: 0 });
  });
  await expect.poll(async () => (await snapshot(page)).state).toBe("over");
  expect((await snapshot(page)).score).toBe(0);
  await page.locator("canvas").click();
  expect(await snapshot(page)).toMatchObject({
    state: "playing",
    phase: "approach",
    active: false,
    shots: 0,
    wave: 0,
    lives: 3,
  });
});

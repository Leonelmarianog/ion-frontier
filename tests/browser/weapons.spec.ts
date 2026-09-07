import { expect, test, type Page } from "@playwright/test";
import type Phaser from "phaser";
import type { WeaponLoadout } from "../../src/game/weapons";
import type { Pickups } from "../../src/systems/Pickups";
import type { Enemies } from "../../src/systems/Enemies";
import type { Projectiles } from "../../src/systems/Projectiles";

type Flight = Phaser.Scene & {
  player: Phaser.Physics.Arcade.Sprite;
  weapons: WeaponLoadout;
  pickups: Pickups;
  enemies: Enemies;
  bullets: Projectiles;
  elapsed: number;
  score: number;
  startRun(): void;
};

async function inspect(page: Page) {
  return page.evaluate(async () => {
    const path = "/src/main.ts";
    const { game } = (await import(path)) as typeof import("../../src/main");
    const scene = game.scene.getScene("flight") as Flight;
    return {
      level: scene.weapons.spreadLevel,
      selected: scene.weapons.selected,
      score: scene.score,
      pods: scene.pickups.group.countActive(true),
      positions: scene.pickups.group
        .getChildren()
        .filter((c) => c.active)
        .map((c) => (c as Phaser.Physics.Arcade.Sprite).x),
    };
  });
}

async function collectPod(page: Page) {
  await page.evaluate(async () => {
    const path = "/src/main.ts";
    const { game } = (await import(path)) as typeof import("../../src/main");
    const scene = game.scene.getScene("flight") as Flight;
    const pod =
      scene.pickups.group.getFirstAlive() as Phaser.Physics.Arcade.Sprite;
    pod.setPosition(scene.player.x, scene.player.y);
  });
  await expect.poll(async () => (await inspect(page)).pods).toBe(0);
}

test("kills drop pods, collection upgrades spread, keyboard switches and retry clears upgrades", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForTimeout(300);
  await page.keyboard.press("Enter", { delay: 100 });
  // Four real projectile/enemy collisions must produce exactly one drop.
  await page.evaluate(async () => {
    const path = "/src/main.ts";
    const { game } = (await import(path)) as typeof import("../../src/main");
    const scene = game.scene.getScene("flight") as Flight;
    for (let i = 0; i < 4; i++) {
      scene.enemies.spawn("scout", 150 + i * 60, scene.elapsed, 1);
      const enemies = scene.enemies.group.getChildren().filter((c) => c.active);
      const enemy = enemies[enemies.length - 1] as Phaser.Physics.Arcade.Sprite;
      enemy.setPosition(600, 150 + i * 60);
      scene.bullets.fire(600, 150 + i * 60, { x: 0, y: 0 });
    }
  });
  await expect.poll(async () => (await inspect(page)).pods).toBe(1);
  expect((await inspect(page)).score).toBe(400);
  await page.keyboard.press("p", { delay: 100 });
  const paused = await inspect(page);
  await page.waitForTimeout(250);
  expect(await inspect(page)).toEqual(paused);
  await page.keyboard.press("p", { delay: 100 });
  await collectPod(page);
  expect(await inspect(page)).toMatchObject({ level: 1, selected: "spread" });
  // Capture one complete volley before it travels offscreen.
  await page.keyboard.down("Space");
  await page.waitForTimeout(60);
  await page.keyboard.up("Space");
  const velocities = await page.evaluate(async () => {
    const path = "/src/main.ts";
    const { game } = (await import(path)) as typeof import("../../src/main");
    const scene = game.scene.getScene("flight") as Flight;
    return scene.bullets.group
      .getChildren()
      .filter((c) => c.active)
      .map((c) => (c as Phaser.Physics.Arcade.Sprite).body!.velocity.y);
  });
  expect(velocities).toHaveLength(3);
  expect(Math.min(...velocities)).toBeLessThan(0);
  expect(Math.max(...velocities)).toBeGreaterThan(0);
  await page.keyboard.press("1", { delay: 100 });
  expect((await inspect(page)).selected).toBe("forward");
  await page.keyboard.press("2", { delay: 100 });
  expect((await inspect(page)).selected).toBe("spread");
  for (let i = 0; i < 2; i++) {
    await page.evaluate(async () => {
      const path = "/src/main.ts";
      const { game } = (await import(path)) as typeof import("../../src/main");
      const scene = game.scene.getScene("flight") as Flight;
      for (let k = 0; k < 4; k++) scene.pickups.onKill(700, 200);
    });
    await collectPod(page);
  }
  expect(await inspect(page)).toMatchObject({ level: 2, score: 650 });
  await page.screenshot({ path: "test-results/weapon-upgrade.png" });
  await page.evaluate(async () => {
    const path = "/src/main.ts";
    const { game } = (await import(path)) as typeof import("../../src/main");
    const scene = game.scene.getScene("flight") as Flight;
    scene.startRun();
  });
  expect(await inspect(page)).toMatchObject({
    level: 0,
    selected: "forward",
    pods: 0,
    score: 0,
  });
  await page.keyboard.press("2", { delay: 100 });
  expect((await inspect(page)).selected).toBe("forward");
  expect(errors).toEqual([]);
});

test("full projectile pools reject partial spread volleys and escaped pods are reused", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForTimeout(300);
  const result = await page.evaluate(async () => {
    const path = "/src/main.ts";
    const { game } = (await import(path)) as typeof import("../../src/main");
    const scene = game.scene.getScene("flight") as Flight;
    for (let i = 0; i < 47; i++) scene.bullets.fire(600, 200, { x: 0, y: 0 });
    const fired = scene.bullets.fireVolley(600, 200, [
      { x: 100, y: -10 },
      { x: 100, y: 0 },
      { x: 100, y: 10 },
    ]);
    for (let i = 0; i < 4; i++) scene.pickups.onKill(600, 200);
    const first =
      scene.pickups.group.getFirstAlive() as Phaser.Physics.Arcade.Sprite;
    first.setX(-40);
    scene.pickups.update();
    const escaped = scene.pickups.group.countActive(true);
    for (let i = 0; i < 4; i++) scene.pickups.onKill(600, 200);
    return {
      fired,
      shots: scene.bullets.group.countActive(true),
      escaped,
      reused: scene.pickups.group.getFirstAlive() === first,
    };
  });
  expect(result).toEqual({ fired: false, shots: 47, escaped: 0, reused: true });
});

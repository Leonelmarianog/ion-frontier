import { describe, expect, it } from "vitest";
import { aimedVelocity, enemyVelocity, ENEMY } from "../src/game/combat";

import { STAGE_FORMATIONS } from "../src/game/stage";

describe("enemy combat", () => {
  it("introduces armed enemies progressively", () => {
    expect(STAGE_FORMATIONS[0].enemies.every((kind) => kind === "scout")).toBe(
      true,
    );
    expect(STAGE_FORMATIONS[1].enemies).toContain("gunner");
    expect(STAGE_FORMATIONS[1].enemies).not.toContain("guardian");
    expect(STAGE_FORMATIONS[2].enemies).toContain("guardian");
    expect(ENEMY.guardian.health).toBeGreaterThan(ENEMY.gunner.health);
  });
  it("aims at the sampled player position at constant speed", () => {
    const shot = aimedVelocity({ x: 500, y: 100 }, { x: 100, y: 400 }, 210);
    expect(Math.hypot(shot.x, shot.y)).toBeCloseTo(210);
    expect(shot.x).toBeLessThan(0);
    expect(shot.y).toBeGreaterThan(0);
    expect(shot.y / shot.x).toBeCloseTo(-0.75);
    expect(aimedVelocity({ x: 1, y: 1 }, { x: 1, y: 1 }, 210)).toEqual({
      x: -210,
      y: 0,
    });
  });
  it("holds guardians temporarily, then releases them so waves can finish", () => {
    expect(enemyVelocity("guardian", 0, 3).x).toBeLessThan(0);
    expect(enemyVelocity("guardian", 1800, 3)).toEqual({ x: 0, y: 0 });
    expect(enemyVelocity("guardian", 6199, 3).x).toBe(0);
    expect(enemyVelocity("guardian", 6200, 3).x).toBeLessThan(0);
    expect(enemyVelocity("scout", 0, 1000)).toEqual(
      enemyVelocity("scout", 0, 100),
    );
  });
});

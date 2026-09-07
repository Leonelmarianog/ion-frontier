import { describe, expect, it } from "vitest";
import {
  StageProgress,
  STAGE_DURATION,
  STAGE_FORMATIONS,
  BOSS_WARNING_DURATION,
  clearBonus,
  flightTime,
} from "../src/game/stage";
import { BOSS_HEALTH, bossPhase, bossVolley } from "../src/game/boss";
import { Waves } from "../src/systems/Waves";
import type { Enemies } from "../src/systems/Enemies";

describe("finite stage", () => {
  it("waits for the last enemies, warns once, and cannot restart after victory", () => {
    const stage = new StageProgress();
    expect(stage.update(STAGE_DURATION - 1, true)).toBe("approach");
    expect(stage.update(STAGE_DURATION, false)).toBe("approach");
    expect(stage.update(STAGE_DURATION + 500, true)).toBe("warning");
    expect(
      stage.update(STAGE_DURATION + 500 + BOSS_WARNING_DURATION - 1, true),
    ).toBe("warning");
    expect(
      stage.update(STAGE_DURATION + 500 + BOSS_WARNING_DURATION, true),
    ).toBe("boss");
    stage.complete();
    expect(stage.update(999999, true)).toBe("complete");
    stage.reset();
    expect(stage.update(0, true)).toBe("approach");
    expect(clearBonus(3)).toBe(8000);
    expect(flightTime(185000)).toBe("3:05");
  });
  it("emits the authored encounters exactly once and resets for replay", () => {
    const kinds: string[] = [];
    const enemies = {
      spawn: (kind: string) => {
        kinds.push(kind);
        return true;
      },
    } as unknown as Enemies;
    const waves = new Waves(enemies);
    for (let time = 0; time < 300000; time += 100) waves.update(time);
    expect(kinds).toEqual(STAGE_FORMATIONS.flatMap((f) => [...f.enemies]));
    expect(waves.number).toBe(10);
    expect(waves.complete).toBe(true);
    waves.reset();
    expect(waves.complete).toBe(false);
    expect(waves.number).toBe(0);
  });
  it("retries a spawn when the pool is full without skipping an enemy", () => {
    let available = false;
    const kinds: string[] = [];
    const enemies = {
      spawn: (kind: string) => {
        if (!available) return false;
        kinds.push(kind);
        return true;
      },
    } as unknown as Enemies;
    const waves = new Waves(enemies);
    waves.update(700);
    expect(kinds).toHaveLength(0);
    available = true;
    for (let time = 1700; time < 300000; time += 100) waves.update(time);
    expect(kinds).toEqual(STAGE_FORMATIONS.flatMap((f) => [...f.enemies]));
  });
});

describe("boss patterns", () => {
  it("switches phase at half health and keeps fan shots directed left", () => {
    expect(bossPhase(BOSS_HEALTH)).toBe(1);
    expect(bossPhase(50)).toBe(2);
    for (const health of [100, 50]) {
      const volley = bossVolley(
        health,
        1,
        { x: 700, y: 270 },
        { x: 140, y: 100 },
      );
      expect(volley).toHaveLength(health === 100 ? 5 : 7);
      for (const shot of volley) {
        expect(shot.x).toBeLessThan(0);
        expect(Math.hypot(shot.x, shot.y)).toBeCloseTo(
          health === 100 ? 190 : 230,
        );
      }
    }
  });
  it("aims the middle burst shot at the player when fired", () => {
    const volley = bossVolley(100, 0, { x: 700, y: 200 }, { x: 100, y: 400 });
    expect(volley).toHaveLength(3);
    expect(volley[1].y / volley[1].x).toBeCloseTo(-1 / 3);
  });
});

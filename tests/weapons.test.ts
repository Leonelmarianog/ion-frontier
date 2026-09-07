import { describe, expect, it } from "vitest";
import { WeaponLoadout, weaponVolley } from "../src/game/weapons";
import { FLIGHT } from "../src/game/rules";

describe("weapon loadout", () => {
  it("unlocks, upgrades, caps, and resets spread", () => {
    const loadout = new WeaponLoadout();
    expect(loadout.select("spread")).toBe(false);
    expect(loadout.selected).toBe("forward");
    expect(loadout.collect().bonus).toBe(0);
    expect(loadout.selected).toBe("spread");
    expect(loadout.spreadLevel).toBe(1);
    loadout.collect();
    expect(loadout.collect().bonus).toBe(250);
    expect(loadout.spreadLevel).toBe(2);
    expect(loadout.select("forward")).toBe(true);
    expect(loadout.select("spread")).toBe(true);
    loadout.reset();
    expect(loadout.spreadLevel).toBe(0);
    expect(loadout.selected).toBe("forward");
  });
  it("keeps spread symmetric and every projectile at the same speed", () => {
    for (const level of [1, 2]) {
      const volley = weaponVolley("spread", level);
      expect(volley).toHaveLength(level === 1 ? 3 : 5);
      expect(volley.reduce((sum, v) => sum + v.y, 0)).toBeCloseTo(0);
      volley.forEach((v) => {
        expect(Math.hypot(v.x, v.y)).toBeCloseTo(FLIGHT.bulletSpeed);
        expect(v.x).toBeGreaterThan(0);
      });
    }
    expect(weaponVolley("forward", 2)).toEqual([
      { x: FLIGHT.bulletSpeed, y: 0 },
    ]);
  });
  it("shares cooldown across weapon switches and does not consume failed volleys", () => {
    const loadout = new WeaponLoadout();
    expect(loadout.fire(0, () => false)).toBe(false);
    expect(loadout.fire(0, () => true)).toBe(true);
    loadout.collect();
    expect(loadout.fire(1, () => true)).toBe(false);
    expect(loadout.fire(130, () => true)).toBe(true);
    loadout.select("forward");
    expect(loadout.fire(369, () => true)).toBe(false);
    expect(loadout.fire(370, () => true)).toBe(true);
    loadout.reset();
    expect(loadout.fire(0, () => true)).toBe(true);
  });
});

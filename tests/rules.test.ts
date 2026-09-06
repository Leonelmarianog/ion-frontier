import { describe, expect, it } from "vitest";
import { movement, waveSize } from "../src/game/rules";

describe("flight rules", () => {
  it("keeps diagonal movement at the same speed as axial movement", () => {
    const diagonal = movement(1, -1, 310);
    expect(Math.hypot(diagonal.x, diagonal.y)).toBeCloseTo(310);
    expect(diagonal.y).toBeLessThan(0);
    expect(movement(0, 0, 310)).toEqual({ x: 0, y: 0 });
  });
  it("increases wave size within the enemy pool budget", () => {
    expect(waveSize(1)).toBe(5);
    expect(waveSize(2)).toBe(7);
    expect(waveSize(1000)).toBe(15);
  });
});

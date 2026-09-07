import { FLIGHT } from "./rules";

export type WeaponKind = "forward" | "spread";
export const MAX_SPREAD_LEVEL = 2;
export const PICKUP_EVERY_KILLS = 4;
export const MAX_PICKUP_BONUS = 250;
export function weaponVolley(kind: WeaponKind, level: number) {
  const angles =
    kind === "forward"
      ? [0]
      : level >= MAX_SPREAD_LEVEL
        ? [-24, -12, 0, 12, 24]
        : [-16, 0, 16];
  return angles.map((degrees) => {
    const angle = (degrees * Math.PI) / 180;
    return {
      x: Math.cos(angle) * FLIGHT.bulletSpeed,
      y: Math.sin(angle) * FLIGHT.bulletSpeed,
    };
  });
}

/** Run-scoped weapon progression; switching never bypasses the firing cooldown. */
export class WeaponLoadout {
  selected: WeaponKind = "forward";
  spreadLevel = 0;
  private nextShot = 0;

  select(kind: WeaponKind) {
    if (kind === "spread" && this.spreadLevel === 0) return false;
    this.selected = kind;
    return true;
  }

  collect() {
    if (this.spreadLevel === MAX_SPREAD_LEVEL)
      return { message: "SPREAD MAX · +250", bonus: MAX_PICKUP_BONUS };
    this.spreadLevel++;
    this.selected = "spread";
    return {
      message:
        this.spreadLevel === 1
          ? "SPREAD UNLOCKED · 3 SHOTS"
          : "SPREAD UPGRADED · 5 SHOTS",
      bonus: 0,
    };
  }

  fire(now: number, emit: (volley: { x: number; y: number }[]) => boolean) {
    if (now < this.nextShot) return false;
    if (!emit(weaponVolley(this.selected, this.spreadLevel))) return false;
    this.nextShot =
      now + (this.selected === "forward" ? FLIGHT.fireInterval : 240);
    return true;
  }

  reset() {
    this.selected = "forward";
    this.spreadLevel = 0;
    this.nextShot = 0;
  }
}

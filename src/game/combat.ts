import { movement } from "./rules";

export type EnemyKind = "scout" | "gunner" | "guardian";
export const ENEMY = {
  scout: {
    health: 1,
    score: 100,
    speed: 180,
    fireInterval: 0,
    color: 0xf57982,
  },
  gunner: {
    health: 2,
    score: 200,
    speed: 115,
    fireInterval: 1800,
    color: 0xffbe69,
  },
  guardian: {
    health: 5,
    score: 500,
    speed: 130,
    fireInterval: 2200,
    color: 0xb399ff,
  },
} as const;
export const HOSTILE_SHOT_SPEED = 210;
export const SHOT_WARNING_MS = 400;

export function aimedVelocity(
  from: { x: number; y: number },
  target: { x: number; y: number },
  speed: number,
) {
  if (from.x === target.x && from.y === target.y) return { x: -speed, y: 0 };
  return movement(target.x - from.x, target.y - from.y, speed);
}

export function enemyVelocity(kind: EnemyKind, age: number, wave: number) {
  const speed = ENEMY[kind].speed + Math.min(Math.max(wave - 1, 0) * 8, 80);
  if (kind === "guardian" && age >= 1800 && age < 6200) return { x: 0, y: 0 };
  return { x: -speed, y: kind === "scout" ? Math.cos(age / 450) * 65 : 0 };
}

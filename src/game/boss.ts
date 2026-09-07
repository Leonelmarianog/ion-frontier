import { aimedVelocity } from "./combat";
export const BOSS_HEALTH = 100;
export const BOSS_ENTRY_MS = 1800;
export const BOSS_TELEGRAPH_MS = 500;
export function bossPhase(health: number) {
  return health > BOSS_HEALTH / 2 ? 1 : 2;
}
export function bossVolley(
  health: number,
  attack: number,
  origin: { x: number; y: number },
  target: { x: number; y: number },
) {
  const phase = bossPhase(health);
  const speed = phase === 1 ? 190 : 230;
  const aimed = attack % 2 === 0;
  const aim = aimedVelocity(origin, target, speed);
  const center = aimed ? Math.atan2(aim.y, aim.x) : Math.PI;
  const offsets = aimed
    ? [-0.13, 0, 0.13]
    : phase === 1
      ? [-0.55, -0.275, 0, 0.275, 0.55]
      : [-0.66, -0.44, -0.22, 0, 0.22, 0.44, 0.66];
  return offsets.map((angle) => ({
    x: Math.cos(center + angle) * speed,
    y: Math.sin(center + angle) * speed,
  }));
}

import type { EnemyKind } from "./combat";

export const STAGE_DURATION = 140_000;
export const BOSS_WARNING_DURATION = 3_000;
export type StagePhase = "approach" | "warning" | "boss" | "complete";
type Formation = { at: number; lane: number; enemies: readonly EnemyKind[] };

// Ten authored encounters: introductions, pressure, and recovery before the finale.
export const STAGE_FORMATIONS: readonly Formation[] = [
  {
    at: 700,
    lane: 160,
    enemies: ["scout", "scout", "scout", "scout", "scout", "scout"],
  },
  {
    at: 14_000,
    lane: 300,
    enemies: ["scout", "scout", "scout", "gunner", "scout", "gunner"],
  },
  {
    at: 28_000,
    lane: 190,
    enemies: ["scout", "scout", "scout", "gunner", "guardian", "scout"],
  },
  {
    at: 42_000,
    lane: 330,
    enemies: [
      "gunner",
      "scout",
      "scout",
      "guardian",
      "scout",
      "gunner",
      "scout",
      "scout",
    ],
  },
  {
    at: 56_000,
    lane: 160,
    enemies: ["scout", "scout", "scout", "scout", "scout", "scout"],
  },
  {
    at: 70_000,
    lane: 290,
    enemies: [
      "gunner",
      "scout",
      "scout",
      "guardian",
      "gunner",
      "scout",
      "scout",
      "guardian",
    ],
  },
  {
    at: 84_000,
    lane: 180,
    enemies: [
      "scout",
      "scout",
      "scout",
      "gunner",
      "gunner",
      "scout",
      "guardian",
      "scout",
      "scout",
    ],
  },
  {
    at: 98_000,
    lane: 320,
    enemies: ["scout", "scout", "scout", "scout", "scout", "scout"],
  },
  {
    at: 112_000,
    lane: 160,
    enemies: [
      "gunner",
      "scout",
      "guardian",
      "scout",
      "gunner",
      "scout",
      "guardian",
      "scout",
      "scout",
    ],
  },
  {
    at: 126_000,
    lane: 280,
    enemies: [
      "scout",
      "scout",
      "scout",
      "gunner",
      "guardian",
      "gunner",
      "scout",
      "scout",
      "guardian",
    ],
  },
];

export class StageProgress {
  phase: StagePhase = "approach";
  private warningAt = 0;

  update(now: number, encountersCleared: boolean) {
    if (
      this.phase === "approach" &&
      now >= STAGE_DURATION &&
      encountersCleared
    ) {
      this.phase = "warning";
      this.warningAt = now;
    } else if (
      this.phase === "warning" &&
      now - this.warningAt >= BOSS_WARNING_DURATION
    ) {
      this.phase = "boss";
    }
    return this.phase;
  }

  complete() {
    if (this.phase === "boss") this.phase = "complete";
  }
  reset() {
    this.phase = "approach";
    this.warningAt = 0;
  }
}

export function clearBonus(lives: number) {
  return 5000 + lives * 1000;
}
export function flightTime(elapsed: number) {
  const seconds = Math.floor(elapsed / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

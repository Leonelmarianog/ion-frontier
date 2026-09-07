import { STAGE_FORMATIONS } from "../game/stage";
import type { Enemies } from "./Enemies";

/** Authored encounters advance on gameplay time; an occupied pool delays spawning. */
export class Waves {
  number = 0;
  private index = 0;
  private nextSpawn = 0;

  constructor(private readonly enemies: Enemies) {}

  get complete() {
    return (
      this.number === STAGE_FORMATIONS.length &&
      this.index === STAGE_FORMATIONS[this.number - 1].enemies.length
    );
  }

  update(now: number) {
    if (this.complete) return;
    const current = STAGE_FORMATIONS[this.number - 1];
    if (!current || this.index === current.enemies.length) {
      const next = STAGE_FORMATIONS[this.number];
      if (now < next.at) return;
      this.number++;
      this.index = 0;
      this.nextSpawn = now;
    }
    if (now < this.nextSpawn) return;
    const formation = STAGE_FORMATIONS[this.number - 1];
    const y =
      110 + ((formation.lane - 110 + Math.floor(this.index / 3) * 105) % 290);
    if (this.enemies.spawn(formation.enemies[this.index], y, now, this.number))
      this.index++;
    this.nextSpawn = now + (this.index % 3 === 0 ? 900 : 400);
  }

  reset() {
    this.number = 0;
    this.index = 0;
    this.nextSpawn = 0;
  }
}

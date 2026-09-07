import { enemyKind } from "../game/combat";
import { waveSize } from "../game/rules";
import { Enemies } from "./Enemies";

/** Schedules formations using gameplay time, so pause freezes the schedule. */
export class Waves {
  number = 0;
  private remaining = 0;
  private index = 0;
  private nextSpawn = 0;
  private nextWave = 700;

  constructor(private readonly enemies: Enemies) {}

  update(now: number) {
    if (
      this.remaining === 0 &&
      this.enemies.group.countActive(true) === 0 &&
      now >= this.nextWave
    ) {
      this.number++;
      this.remaining = waveSize(this.number);
      this.index = 0;
      this.nextSpawn = now;
    }
    if (this.remaining === 0 || now < this.nextSpawn) return;
    const formation = Math.floor(this.index / 3);
    const y = 120 + ((formation * 125 + this.number * 37) % 290);
    if (
      this.enemies.spawn(
        enemyKind(this.number, this.index),
        y,
        now,
        this.number,
      )
    ) {
      this.remaining--;
      this.index++;
    }
    this.nextSpawn = now + (this.index % 3 === 0 ? 1000 : 360);
    this.nextWave = now + 2500;
  }

  reset() {
    this.number = 0;
    this.remaining = 0;
    this.index = 0;
    this.nextSpawn = 0;
    this.nextWave = 700;
  }
}

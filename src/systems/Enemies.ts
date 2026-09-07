import Phaser from "phaser";
import {
  ENEMY,
  HOSTILE_SHOT_SPEED,
  SHOT_WARNING_MS,
  aimedVelocity,
  enemyVelocity,
  type EnemyKind,
} from "../game/combat";
import { Projectiles } from "./Projectiles";

type EnemySprite = Phaser.Physics.Arcade.Sprite;
type EnemyState = {
  kind: EnemyKind;
  health: number;
  born: number;
  nextShot: number;
  wave: number;
};

export class Enemies {
  readonly group: Phaser.Physics.Arcade.Group;
  private readonly states = new Map<EnemySprite, EnemyState>();

  constructor(
    scene: Phaser.Scene,
    private readonly shots: Projectiles,
  ) {
    this.group = scene.physics.add.group({ defaultKey: "scout", maxSize: 24 });
  }

  spawn(kind: EnemyKind, y: number, now: number, wave: number) {
    const enemy = this.group.get(990, y) as EnemySprite | null;
    if (!enemy) return false;
    enemy.setTexture(kind).setScale(1).clearTint().setAlpha(1);
    enemy.enableBody(true, 990, y, true, true);
    enemy.setSize(kind === "guardian" ? 40 : 28, kind === "guardian" ? 32 : 24);
    const velocity = enemyVelocity(kind, 0, wave);
    enemy.setVelocity(velocity.x, velocity.y);
    this.states.set(enemy, {
      kind,
      health: ENEMY[kind].health,
      born: now,
      nextShot: now + 1600,
      wave,
    });
    return true;
  }

  /** Returns points only on the hit that destroys a live enemy. */
  hit(enemy: EnemySprite) {
    const state = this.states.get(enemy);
    if (!enemy.active || !state) return 0;
    state.health--;
    if (state.health > 0) return 0;
    enemy.disableBody(true, true);
    return ENEMY[state.kind].score;
  }

  update(now: number, target: { x: number; y: number }) {
    this.states.forEach((state, enemy) => {
      if (!enemy.active) return;
      if (enemy.x < -40) {
        enemy.disableBody(true, true);
        return;
      }
      const velocity = enemyVelocity(state.kind, now - state.born, state.wave);
      enemy.setVelocity(velocity.x, velocity.y);
      const canFire =
        ENEMY[state.kind].fireInterval > 0 &&
        enemy.x < 930 &&
        enemy.x > target.x + 50;
      enemy.setTint(
        canFire && now >= state.nextShot - SHOT_WARNING_MS
          ? 0xffffff
          : ENEMY[state.kind].color,
      );
      if (!canFire || now < state.nextShot) return;
      const origin = { x: enemy.x - 24, y: enemy.y };
      this.shots.fire(
        origin.x,
        origin.y,
        aimedVelocity(origin, target, HOSTILE_SHOT_SPEED),
      );
      // No catch-up bursts after a pause or a full projectile pool.
      state.nextShot = now + ENEMY[state.kind].fireInterval;
    });
  }

  reset() {
    this.group
      .getChildren()
      .forEach((child) => (child as EnemySprite).disableBody(true, true));
    this.states.clear();
  }
}

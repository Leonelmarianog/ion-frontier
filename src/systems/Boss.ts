import Phaser from "phaser";
import {
  BOSS_ENTRY_MS,
  BOSS_HEALTH,
  BOSS_TELEGRAPH_MS,
  bossPhase,
  bossVolley,
} from "../game/boss";
import { Projectiles } from "./Projectiles";

export class Boss {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  health = BOSS_HEALTH;
  private born = 0;
  private nextShot = 0;
  private attack = 0;
  private vulnerable = false;
  private bar: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    private readonly shots: Projectiles,
  ) {
    this.sprite = scene.physics.add
      .sprite(1050, 270, "boss")
      .setImmovable(true);
    this.sprite.setSize(112, 104).setOffset(12, 12).disableBody(true, true);
    this.bar = scene.add.graphics().setDepth(5);
    this.label = scene.add
      .text(480, 490, "", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#ffbe99",
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.label.setVisible(false);
  }

  spawn(now: number) {
    this.health = BOSS_HEALTH;
    this.born = now;
    this.nextShot = now + BOSS_ENTRY_MS + 1100;
    this.attack = 0;
    this.vulnerable = false;
    this.sprite
      .enableBody(true, 1050, 270, true, true)
      .clearTint()
      .setVelocity(0);
    this.label.setVisible(true);
    this.drawHud();
  }

  hit() {
    if (!this.sprite.active || !this.vulnerable || this.health <= 0)
      return false;
    this.health--;
    this.drawHud();
    if (this.health > 0) return false;
    this.sprite.disableBody(true, true);
    return true;
  }

  update(now: number, target: { x: number; y: number }) {
    if (!this.sprite.active) return;
    const age = now - this.born;
    if (age < BOSS_ENTRY_MS) {
      this.sprite.setVelocity(-260 / (BOSS_ENTRY_MS / 1000), 0);
      return;
    }
    this.vulnerable = true;
    // Reset the physics body with its visual position for reliable collisions.
    this.sprite.setVelocity(0);
    (this.sprite.body as Phaser.Physics.Arcade.Body).reset(
      790,
      270 + Math.sin((age - BOSS_ENTRY_MS) / 1300) * 105,
    );
    this.sprite.setTint(
      now >= this.nextShot - BOSS_TELEGRAPH_MS
        ? 0xffffff
        : bossPhase(this.health) === 1
          ? 0xffbe99
          : 0xff8099,
    );
    if (now >= this.nextShot) {
      const origin = { x: this.sprite.x - 70, y: this.sprite.y };
      this.shots.fireVolley(
        origin.x,
        origin.y,
        bossVolley(this.health, this.attack, origin, target),
      );
      this.attack++;
      this.nextShot = now + (bossPhase(this.health) === 1 ? 1800 : 1300);
    }
    this.drawHud();
  }

  private drawHud() {
    this.bar.clear();
    this.bar.fillStyle(0x352739);
    this.bar.fillRect(280, 511, 400, 7);
    this.bar.fillStyle(bossPhase(this.health) === 1 ? 0xffbe99 : 0xff8099);
    this.bar.fillRect(280, 511, (400 * this.health) / BOSS_HEALTH, 7);
    this.label.setText(
      `RIM WARDEN / PHASE ${bossPhase(this.health)} · ${this.health}/${BOSS_HEALTH}`,
    );
  }

  reset() {
    this.sprite.disableBody(true, true);
    this.health = BOSS_HEALTH;
    this.vulnerable = false;
    this.born = 0;
    this.nextShot = 0;
    this.attack = 0;
    this.bar.clear();
    this.label.setVisible(false);
  }
}

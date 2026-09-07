import Phaser from "phaser";
import { WORLD } from "../game/rules";

/** Fixed-capacity projectiles; reset every body on reuse and release offscreen shots. */
export class Projectiles {
  readonly group: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, texture: string, capacity: number) {
    this.group = scene.physics.add.group({
      defaultKey: texture,
      maxSize: capacity,
    });
  }

  fire(x: number, y: number, velocity: { x: number; y: number }) {
    const shot = this.group.get(x, y) as Phaser.Physics.Arcade.Sprite | null;
    if (!shot) return false;
    shot.enableBody(true, x, y, true, true);
    shot.setVelocity(velocity.x, velocity.y);
    return true;
  }

  fireVolley(x: number, y: number, velocities: { x: number; y: number }[]) {
    if (this.group.maxSize - this.group.countActive(true) < velocities.length)
      return false;
    velocities.forEach((velocity) => this.fire(x, y, velocity));
    return true;
  }

  update() {
    this.group.getChildren().forEach((child) => {
      const shot = child as Phaser.Physics.Arcade.Sprite;
      if (
        shot.active &&
        (shot.x < -40 ||
          shot.x > WORLD.width + 40 ||
          shot.y < -40 ||
          shot.y > WORLD.height + 40)
      )
        shot.disableBody(true, true);
    });
  }

  reset() {
    this.group
      .getChildren()
      .forEach((child) =>
        (child as Phaser.Physics.Arcade.Sprite).disableBody(true, true),
      );
  }
}

import Phaser from "phaser";
import { PICKUP_EVERY_KILLS } from "../game/weapons";
import { WORLD } from "../game/rules";

/** Deterministic drops reward kills, without counting escapes or collisions. */
export class Pickups {
  readonly group: Phaser.Physics.Arcade.Group;
  private kills = 0;

  constructor(scene: Phaser.Scene) {
    this.group = scene.physics.add.group({
      defaultKey: "spread-pickup",
      maxSize: 8,
    });
  }

  onKill(x: number, y: number) {
    this.kills++;
    if (this.kills % PICKUP_EVERY_KILLS !== 0) return;
    const pickup = this.group.get(x, y) as Phaser.Physics.Arcade.Sprite | null;
    if (!pickup) return;
    pickup.enableBody(
      true,
      Phaser.Math.Clamp(x, 20, WORLD.width - 20),
      Phaser.Math.Clamp(y, 70, WORLD.height - 30),
      true,
      true,
    );
    pickup.setSize(30, 30).setVelocity(-85, 0);
  }

  update() {
    this.group.getChildren().forEach((child) => {
      const pickup = child as Phaser.Physics.Arcade.Sprite;
      if (pickup.active && pickup.x < -30) pickup.disableBody(true, true);
    });
  }

  reset() {
    this.kills = 0;
    this.group
      .getChildren()
      .forEach((child) =>
        (child as Phaser.Physics.Arcade.Sprite).disableBody(true, true),
      );
  }
}

import Phaser from "phaser";
import { FLIGHT, WORLD, movement } from "../game/rules";

import { Projectiles } from "../systems/Projectiles";
import { Enemies } from "../systems/Enemies";
import { Waves } from "../systems/Waves";

type Sprite = Phaser.Physics.Arcade.Sprite;

export class FlightScene extends Phaser.Scene {
  private player!: Sprite;
  private bullets!: Projectiles;
  private hostileShots!: Projectiles;
  private waves!: Waves;
  private enemies!: Enemies;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private stars: { dot: Phaser.GameObjects.Rectangle; speed: number }[] = [];
  private hud!: Phaser.GameObjects.Text;
  private overlay!: Phaser.GameObjects.Container;
  private state: "ready" | "playing" | "paused" | "over" = "ready";
  private score = 0;
  private lives = FLIGHT.lives;
  private elapsed = 0;
  private nextShot = 0;
  private invincibleUntil = 0;

  constructor() {
    super("flight");
  }

  create() {
    this.makeTextures();
    for (let i = 0; i < 100; i++) {
      const depth = Phaser.Math.Between(1, 3);
      this.stars.push({
        dot: this.add.rectangle(
          Math.random() * WORLD.width,
          Math.random() * WORLD.height,
          depth === 3 ? 3 : 2,
          2,
          0x9bbfee,
          depth * 0.22,
        ),
        speed: depth * 22,
      });
    }
    this.add.circle(770, 155, 83, 0x152947).setAlpha(0.65);
    this.add.circle(749, 142, 77, 0x0b162b);
    const terrain = this.add.graphics();
    terrain.fillStyle(0x102139);
    terrain.fillPoints(
      [
        { x: 0, y: 540 },
        { x: 0, y: 500 },
        { x: 90, y: 460 },
        { x: 180, y: 492 },
        { x: 310, y: 438 },
        { x: 390, y: 480 },
        { x: 535, y: 450 },
        { x: 660, y: 505 },
        { x: 800, y: 445 },
        { x: 960, y: 490 },
        { x: 960, y: 540 },
      ],
      true,
    );
    this.player = this.physics.add
      .sprite(140, 270, "ship")
      .setCollideWorldBounds(true);
    this.player.setSize(27, 14).setOffset(9, 9);
    this.bullets = new Projectiles(this, "bolt", 48);
    this.hostileShots = new Projectiles(this, "hostile-bolt", 64);
    this.enemies = new Enemies(this, this.hostileShots);
    this.waves = new Waves(this.enemies);
    this.physics.add.overlap(
      this.bullets.group,
      this.enemies.group,
      (bullet, enemy) => {
        if (
          !(bullet as Sprite).active ||
          !(enemy as Sprite).active ||
          this.state !== "playing"
        )
          return;
        (bullet as Sprite).disableBody(true, true);
        const points = this.enemies.hit(enemy as Sprite);
        this.spark(
          (enemy as Sprite).x,
          (enemy as Sprite).y,
          points ? 0xffad75 : 0xffffff,
        );
        this.score += points;
      },
    );
    this.physics.add.overlap(
      this.player,
      this.enemies.group,
      (_player, enemy) => {
        if (!this.canTakeDamage() || !(enemy as Sprite).active) return;
        (enemy as Sprite).disableBody(true, true);
        this.damage();
      },
    );
    this.physics.add.overlap(
      this.player,
      this.hostileShots.group,
      (_player, shot) => {
        if (!(shot as Sprite).active || this.state !== "playing") return;
        (shot as Sprite).disableBody(true, true);
        if (this.canTakeDamage()) this.damage();
      },
    );
    this.keys = this.input.keyboard!.addKeys(
      "W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,ENTER,P",
    ) as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.addCapture(["SPACE", "UP", "DOWN", "LEFT", "RIGHT"]);
    this.hud = this.add
      .text(26, 22, "", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#b7d0ed",
      })
      .setDepth(5);
    this.overlay = this.add.container(0, 0).setDepth(10);
    this.showOverlay(
      "ION FRONTIER",
      "PATROL THE OUTER RIM",
      "PRESS ENTER OR CLICK TO LAUNCH",
    );
    this.input.on("pointerdown", () => {
      if (this.state === "ready" || this.state === "over") this.startRun();
    });
    const onBlur = () => {
      if (this.state === "playing") this.pauseRun();
    };
    this.game.events.on(Phaser.Core.Events.BLUR, onBlur);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.game.events.off(Phaser.Core.Events.BLUR, onBlur),
    );
    this.physics.pause();
    this.updateHud();
  }

  private makeTextures() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x5df4d1);
    g.fillTriangle(0, 10, 15, 16, 0, 22);
    g.fillStyle(0xd9edff);
    g.fillPoints(
      [
        { x: 8, y: 13 },
        { x: 15, y: 1 },
        { x: 25, y: 11 },
        { x: 46, y: 16 },
        { x: 25, y: 21 },
        { x: 15, y: 31 },
        { x: 8, y: 19 },
      ],
      true,
    );
    g.fillStyle(0x3b81a1);
    g.fillRect(15, 13, 15, 6);
    g.generateTexture("ship", 48, 32);
    g.clear();
    g.fillStyle(0x82ffe4);
    g.fillRoundedRect(0, 0, 22, 5, 2);
    g.generateTexture("bolt", 22, 5);
    g.clear();
    g.fillStyle(0xffffff);
    g.fillTriangle(0, 16, 30, 0, 30, 32);
    g.fillStyle(0x66364f);
    g.fillTriangle(12, 16, 35, 6, 35, 26);
    g.fillStyle(0xffd49a);
    g.fillRect(6, 13, 8, 6);
    g.generateTexture("scout", 36, 32);
    g.clear();
    g.fillStyle(0xffffff);
    g.fillRoundedRect(3, 4, 32, 24, 5);
    g.fillRect(0, 13, 16, 6);
    g.fillStyle(0x583d28);
    g.fillRect(20, 10, 10, 12);
    g.generateTexture("gunner", 36, 32);
    g.clear();
    g.fillStyle(0xffffff);
    g.fillPoints(
      [
        { x: 0, y: 24 },
        { x: 12, y: 3 },
        { x: 42, y: 3 },
        { x: 48, y: 24 },
        { x: 42, y: 45 },
        { x: 12, y: 45 },
      ],
      true,
    );
    g.fillStyle(0x48376c);
    g.fillRect(17, 12, 18, 24);
    g.generateTexture("guardian", 48, 48);
    g.clear();
    g.fillStyle(0xff805e);
    g.fillCircle(6, 6, 6);
    g.fillStyle(0xfff3c2);
    g.fillCircle(6, 6, 3);
    g.generateTexture("hostile-bolt", 12, 12);
    g.destroy();
  }

  private showOverlay(title: string, subtitle: string, prompt: string) {
    this.overlay.removeAll(true);
    const shade = this.add.rectangle(480, 270, 960, 540, 0x060c1a, 0.75);
    const label = (y: number, text: string, size: number, color: string) =>
      this.add
        .text(480, y, text, {
          fontFamily: "monospace",
          fontSize: `${size}px`,
          color,
          align: "center",
        })
        .setOrigin(0.5);
    this.overlay.add([
      shade,
      label(204, subtitle, 14, "#79efd0"),
      label(255, title, 48, "#eff6ff"),
      label(323, prompt, 15, "#a7b9d3"),
      label(
        366,
        "WASD / ARROWS  ·  SPACE TO FIRE  ·  P TO PAUSE",
        12,
        "#758caa",
      ),
    ]);
    this.overlay.setVisible(true);
  }

  private startRun() {
    this.bullets.reset();
    this.hostileShots.reset();
    this.enemies.reset();
    this.waves.reset();
    this.score = 0;
    this.lives = FLIGHT.lives;
    this.elapsed = 0;
    this.nextShot = 0;
    this.invincibleUntil = 0;
    this.player.setPosition(140, 270).setAlpha(1).setVelocity(0);
    this.state = "playing";
    this.overlay.setVisible(false);
    this.physics.resume();
  }

  private pauseRun() {
    this.state = "paused";
    this.physics.pause();
    this.showOverlay("FLIGHT PAUSED", "TAKE A BREATHER", "PRESS P TO RESUME");
  }

  private canTakeDamage() {
    return this.state === "playing" && this.elapsed >= this.invincibleUntil;
  }

  private damage() {
    this.lives--;
    this.updateHud();
    this.invincibleUntil = this.elapsed + 1500;
    this.spark(this.player.x, this.player.y, 0x79efd0);
    this.cameras.main.shake(150, 0.005);
    if (this.lives <= 0) {
      this.state = "over";
      this.physics.pause();
      this.player.setVelocity(0);
      this.showOverlay(
        "SIGNAL LOST",
        `FINAL SCORE ${this.score.toString().padStart(6, "0")}`,
        "PRESS ENTER OR CLICK TO RETRY",
      );
    }
  }

  private spark(x: number, y: number, color: number) {
    const ring = this.add.circle(x, y, 8, color, 0.8);
    this.tweens.add({
      targets: ring,
      radius: 35,
      alpha: 0,
      duration: 220,
      onComplete: () => ring.destroy(),
    });
  }

  private updateHud() {
    this.hud.setText(
      `SCORE ${this.score.toString().padStart(6, "0")}                  SECTOR 07 / WAVE ${String(this.waves.number).padStart(2, "0")}          HULL ${"◆".repeat(this.lives)}${"◇".repeat(FLIGHT.lives - this.lives)}`,
    );
  }

  update(_time: number, delta: number) {
    if (!this.keys) return;
    if (
      Phaser.Input.Keyboard.JustDown(this.keys.ENTER) &&
      (this.state === "ready" || this.state === "over")
    )
      this.startRun();
    if (Phaser.Input.Keyboard.JustDown(this.keys.P)) {
      if (this.state === "playing") this.pauseRun();
      else if (this.state === "paused") {
        this.state = "playing";
        this.overlay.setVisible(false);
        this.physics.resume();
      }
    }
    if (this.state !== "playing") return;
    const dt = Math.min(delta, 50);
    this.elapsed += dt;
    this.stars.forEach(({ dot, speed }) => {
      dot.x -= (speed * dt) / 1000;
      if (dot.x < 0) dot.x = WORLD.width;
    });
    const down = (a: string, b: string) =>
      Number(this.keys[a].isDown || this.keys[b].isDown);
    const velocity = movement(
      down("D", "RIGHT") - down("A", "LEFT"),
      down("S", "DOWN") - down("W", "UP"),
      FLIGHT.speed,
    );
    this.player.setVelocity(velocity.x, velocity.y);
    this.player.setAlpha(
      this.elapsed < this.invincibleUntil
        ? Math.floor(this.elapsed / 90) % 2
          ? 0.3
          : 1
        : 1,
    );
    if (this.keys.SPACE.isDown && this.elapsed >= this.nextShot) {
      this.bullets.fire(this.player.x + 28, this.player.y, {
        x: FLIGHT.bulletSpeed,
        y: 0,
      });
      this.nextShot = this.elapsed + FLIGHT.fireInterval;
    }
    this.waves.update(this.elapsed);
    this.enemies.update(this.elapsed, this.player);
    this.bullets.update();
    this.hostileShots.update();
    this.updateHud();
  }
}

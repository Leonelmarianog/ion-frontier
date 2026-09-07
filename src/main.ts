import Phaser from "phaser";
import { FlightScene } from "./scenes/FlightScene";
import { WORLD } from "./game/rules";
import "./style.css";

export const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: WORLD.width,
  height: WORLD.height,
  backgroundColor: "#080e20",
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: "arcade", arcade: { debug: false } },
  scene: [FlightScene],
});

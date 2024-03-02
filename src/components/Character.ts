import * as PIXI from "pixi.js";
import Coords from "@/models/Coords";

export type CharacterType = "player" | "enemy";

export default class Character extends PIXI.Container {
  coords: Coords;
  sprite: PIXI.Sprite;
  type: CharacterType;
  constructor(type: CharacterType) {
    super();

    this.type = type;

    this.coords = new Coords(0, 0);

    this.sprite = PIXI.Sprite.from("character.png");
    this.sprite.anchor.set(0.5);
    this.addChild(this.sprite);
  }
  get isPlayer(): boolean {
    return this.type == "player";
  }
  get isEnemy(): boolean {
    return this.type != "player";
  }
}

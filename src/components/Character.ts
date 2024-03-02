import * as PIXI from "pixi.js";
import Coords from "@/models/Coords";

export default class Character extends PIXI.Container {
  coords: Coords;
  sprite: PIXI.Sprite;
  constructor() {
    super();

    this.coords = new Coords(0, 0);

    this.sprite = PIXI.Sprite.from("character.png");
    this.sprite.anchor.set(0.5);
    this.addChild(this.sprite);
  }
}


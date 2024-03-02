import * as PIXI from "pixi.js";

export default abstract class Screen extends PIXI.Container {
  setSize(width: number, height: number) {}
  onAddedToStage(stage: PIXI.Container) {}
  onRemovedFromStage(stage: PIXI.Container) {}
}

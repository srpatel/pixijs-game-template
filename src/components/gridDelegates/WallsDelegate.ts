import * as PIXI from "pixi.js";
import Grid from "../Grid";
import { Actions } from "pixi-actions";
import Coords from "@/models/Coords";
import Wall from "../Wall";

export default class WallsDelegate {
  grid: Grid;

  walls: Wall[] = [];
  wallsHolder: PIXI.Container = new PIXI.Container();

  edgeWalls: Wall[] = [];
  edgeWallsHolder: PIXI.Container = new PIXI.Container();

  constructor(grid: Grid) {
    this.grid = grid;
  }

  generateWalls(numWalls: number) {
    // Delete all old walls
    for (const w of this.walls) {
      Actions.fadeOutAndRemove(w, 0.2).play();
    }
    this.walls = Wall.randomLayout(numWalls, this.grid.dimension);

    // Add some new walls... they must generate any closed areas
    this.drawWalls();

    this.edgeWalls = Wall.edges(this.grid.dimension);
    this.drawWalls(true);
  }

  drawWalls(edges: boolean = false) {
    const walls = edges ? this.edgeWalls : this.walls;
    const holder = edges ? this.edgeWallsHolder : this.wallsHolder;
    (holder as any).cacheAsBitmap = false;
    holder.removeChildren();
    for (const w of walls) {
      holder.addChild(w);

      // Place in the correct place
      this.grid.setPositionTo(w, w.from, true);
    }
    (holder as any).cacheAsBitmap = true;
  }

  doesWallSeparate(start: Coords, dx: number, dy: number): Wall {
    for (const wh of [this.walls, this.edgeWalls]) {
      for (const w of wh) {
        if (w.blocks(start, dx, dy)) {
          return w;
        }
      }
    }
    return null;
  }
}

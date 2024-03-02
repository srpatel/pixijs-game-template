import * as PIXI from "pixi.js";
import { Action, Actions } from "pixi-actions";
import Coords from "@/models/Coords";
import Character from "./Character";
import Wall from "./Wall";

export default class Grid extends PIXI.Container {
  // The number of cells in each dimension
  dimension: number;
  // The size in pixels of one cell
  cellSize: number;

  walls: Wall[] = [];
  wallsHolder: PIXI.Container = new PIXI.Container();

  edgeWalls: Wall[] = [];
  edgeWallsHolder: PIXI.Container = new PIXI.Container();

  characters: Character[] = [];
  charactersHolder: PIXI.Container = new PIXI.Container();

  backgroundSquares: PIXI.Sprite[] = [];
  backgroundSquaresHolder: PIXI.Container = new PIXI.Container();

  constructor(dimension: number) {
    super();
    this.dimension = dimension;
    this.cellSize = 100;

    // Add children
    this.addChild(this.backgroundSquaresHolder);
    this.addChild(this.charactersHolder);
    this.addChild(this.wallsHolder);
    this.addChild(this.edgeWallsHolder);

    // Add background squares
    for (let i = 0; i < this.dimension; i++) {
      for (let j = 0; j < this.dimension; j++) {
        const cell = PIXI.Sprite.from(PIXI.Texture.WHITE);
        cell.tint = (i + j) % 2 == 0 ? 0xf4f4f4 : 0xe4e4e4;
        cell.width = this.cellSize;
        cell.height = this.cellSize;
        const offset1 = (this.cellSize - cell.width) / 2;
        cell.position.set(
          i * this.cellSize + offset1,
          j * this.cellSize + offset1,
        );
        this.backgroundSquares.push(cell);
        this.backgroundSquaresHolder.addChild(cell);
      }
    }
  }

  // The size in pixels of an edge
  // differs from .width because decorations which are longer than the edge
  // are not included
  get edgeSize(): number {
    return this.cellSize * this.dimension;
  }

  inBounds(col: number | Coords, row: number = null) {
    let c = 0,
      r = 0;
    if (typeof col == "number") {
      c = col;
      r = row;
    } else {
      c = col.col;
      r = col.row;
    }
    return !(c < 0 || c >= this.dimension || r < 0 || r >= this.dimension);
  }

  makeMoveTo(
    character: Character,
    dx: number = 0,
    dy: number = 0,
    time: number = 0.1,
  ): Action {
    return Actions.moveTo(
      character,
      this.cellSize * (character.coords.col + dx) + this.cellSize / 2,
      this.cellSize * (character.coords.row + dy) + this.cellSize / 2,
      time,
    );
  }

  setPositionTo(
    actor: PIXI.Container,
    coords: Coords,
    isWall: boolean = false,
  ) {
    if (isWall) {
      if ((actor as Wall).isHorizontal) {
        actor.position.set(
          this.cellSize * coords.col + this.cellSize / 2,
          this.cellSize * coords.row,
        );
      } else {
        actor.position.set(
          this.cellSize * coords.col,
          this.cellSize * coords.row + this.cellSize / 2,
        );
      }
    } else {
      actor.position.set(
        this.cellSize * coords.col + this.cellSize / 2,
        this.cellSize * coords.row + this.cellSize / 2,
      );
    }
  }

  generateWalls(numWalls: number) {
    // Delete all old walls
    for (const w of this.walls) {
      Actions.fadeOutAndRemove(w, 0.2).play();
    }
    this.walls = Wall.randomLayout(numWalls, this.dimension);

    // Add some new walls... they must generate any closed areas
    this.drawWalls();

    this.edgeWalls = Wall.edges(this.dimension);
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
      this.setPositionTo(w, w.from, true);
    }
    (holder as any).cacheAsBitmap = true;
  }
}

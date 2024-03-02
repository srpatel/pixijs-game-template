import * as PIXI from "pixi.js";
import { Action, Actions } from "pixi-actions";
import Coords from "@/models/Coords";
import Character from "./Character";
import Wall from "./Wall";
import WallsDelegate from "./gridDelegates/WallsDelegate";
import CharactersDelegate from "./gridDelegates/CharactersDelegate";

export default class Grid extends PIXI.Container {
  // The number of cells in each dimension
  dimension: number;
  // The size in pixels of one cell
  cellSize: number;

  // Delegates
  dWalls: WallsDelegate = new WallsDelegate(this);
  dChars: CharactersDelegate = new CharactersDelegate(this);

  backgroundSquares: PIXI.Sprite[] = [];
  backgroundSquaresHolder: PIXI.Container = new PIXI.Container();

  constructor(dimension: number) {
    super();
    this.dimension = dimension;
    this.cellSize = 100;

    // Add children
    this.addChild(this.backgroundSquaresHolder);
    this.addChild(this.dChars.charactersHolder);
    this.addChild(this.dWalls.wallsHolder);
    this.addChild(this.dWalls.edgeWallsHolder);

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
}

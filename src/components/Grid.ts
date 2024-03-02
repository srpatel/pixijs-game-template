import * as PIXI from "pixi.js";
import { Action, Actions } from "pixi-actions";
import Coords from "@/models/Coords";
import Character from "./Character";
import Wall from "./Wall";
import WallsDelegate from "./gridDelegates/WallsDelegate";

export default class Grid extends PIXI.Container {
  // The number of cells in each dimension
  dimension: number;
  // The size in pixels of one cell
  cellSize: number;

  // Delegates
  dWalls: WallsDelegate = new WallsDelegate(this);

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

  bumpAnimation(character: Character, dx: number, dy: number) {
    const time = 0.1;
    Actions.sequence(
      this.makeMoveTo(character, dx * 0.1, dy * 0.1, time / 2),
      this.makeMoveTo(character, 0, 0, time / 2),
    ).play();
    return time;
  }

  addCharacter(character: Character) {
    this.characters.push(character);
    this.charactersHolder.addChild(character);

    // Place in the correct place!
    this.setPositionTo(character, character.coords);
  }

  getCharacterAt(col: number | Coords, row: number = null): Character {
    let c = 0;
    let r = 0;
    if (typeof col == "number") {
      c = col;
      r = row;
    } else {
      c = col.col;
      r = col.row;
    }
    for (const char of this.characters) {
      if (char.coords.col == c && char.coords.row == r) {
        return char;
      }
    }
    return null;
  }

  moveCharacter(
    character: Character,
    dx: number,
    dy: number,
    ignoreWalls: boolean = false,
  ): { didMove: boolean; delay: number; dx: number; dy: number } {
    // Flip to face the right direction
    if (dx != 0) {
      character.sprite.scale.x = dx > 0 ? 1 : -1;
    }

    const targetCoord = character.coords.clone().add(dx, dy);

    if (!ignoreWalls && this.dWalls.doesWallSeparate(character.coords, dx, dy)) {
      // Bumping into hedge/fence
      // TODO : Hedge noise
      const delay = this.bumpAnimation(character, dx, dy);
      return { didMove: false, delay, dx, dy };
    }

    if (!this.inBounds(targetCoord)) {
      return { didMove: true, delay: 0, dx, dy };
    }

    // Is there another character here?
    try {
      const targetCharacter = this.getCharacterAt(targetCoord);
      if (targetCharacter) {
        let delay = this.bumpAnimation(character, dx, dy);
        if (character.isPlayer && targetCharacter.isEnemy) {
          // TODO : Attack noise - we attack enemy
          return { didMove: true, delay, dx, dy };
        } else if (character.isEnemy && targetCharacter.isPlayer) {
          // TODO : Ouch noise - enemy attacks us
          return { didMove: true, delay, dx, dy };
        } else {
          return { didMove: false, delay, dx, dy };
        }
      }
    } catch (e) {
      console.error(e);
      return { didMove: true, delay: 0, dx, dy };
    }

    // Move the character
    if (character.isPlayer) {
      // TODO : Step noise
    }

    character.coords.set(targetCoord);

    // Animate to the new position
    this.makeMoveTo(character).play();
    return { didMove: true, delay: 0.05, dx, dy };
  }
}

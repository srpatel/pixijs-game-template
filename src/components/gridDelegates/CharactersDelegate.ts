import * as PIXI from "pixi.js";
import Grid from "../Grid";
import { Action, Actions } from "pixi-actions";
import Coords from "@/models/Coords";
import Character from "../Character";

export default class CharactersDelegate {
  grid: Grid;

  characters: Character[] = [];
  charactersHolder: PIXI.Container = new PIXI.Container();

  constructor(grid: Grid) {
    this.grid = grid;
  }
  makeMoveTo(
    character: Character,
    dx: number = 0,
    dy: number = 0,
    time: number = 0.1,
  ): Action {
    return Actions.moveTo(
      character,
      this.grid.cellSize * (character.coords.col + dx) + this.grid.cellSize / 2,
      this.grid.cellSize * (character.coords.row + dy) + this.grid.cellSize / 2,
      time,
    );
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
    this.grid.setPositionTo(character, character.coords);
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

    if (
      !ignoreWalls &&
      this.grid.dWalls.doesWallSeparate(character.coords, dx, dy)
    ) {
      // Bumping into hedge/fence
      // TODO : Hedge noise
      const delay = this.bumpAnimation(character, dx, dy);
      return { didMove: false, delay, dx, dy };
    }

    if (!this.grid.inBounds(targetCoord)) {
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

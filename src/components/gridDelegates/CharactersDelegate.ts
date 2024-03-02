import * as PIXI from "pixi.js";
import Grid from "../Grid";
import { Action, Actions } from "pixi-actions";
import Coords from "@/models/Coords";
import Character from "../Character";
import _ from "underscore";

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

  moveEnemies(playerCharacter: Character) {
    let delay = 0;

    // 1. Dijkstra the grid, ignoring enemies
    // Pick the closest character
    const dijks = this.dijkstra(playerCharacter.coords, false);
    const enemiesAndDistances = [];
    for (const char of this.characters) {
      if (char.isEnemy) {
        let distance = 0;
        if (this.grid.inBounds(char.coords)) {
          distance = dijks.distance[char.coords.col][char.coords.row];
        } else {
          distance = 999;
        }
        enemiesAndDistances.push({
          distance,
          char,
        });
      }
    }

    // 2. Sort by closest to furthest
    let sortedEnemies = _.sortBy(enemiesAndDistances, "distance");

    // 3. For each enemy, pathfind (properly) to the player
    let atLeastOneMove = false;
    for (let tries = 0; tries < 5; tries++) {
      const tryAgainLater = [];
      for (const e of sortedEnemies) {
        const char = e.char;

        let targetCol;
        let targetRow;
        let ignoreWalls = false;
        if (!this.grid.inBounds(char.coords)) {
          // If this is out of the scene, move directly into the screen
          // (if the spot is free)
          targetCol = char.coords.col;
          targetRow = char.coords.row;
          if (targetCol < 0) {
            targetCol = 0;
          } else if (targetCol >= this.grid.dimension) {
            targetCol = this.grid.dimension - 1;
          }
          if (targetRow < 0) {
            targetRow = 0;
          } else if (targetRow >= this.grid.dimension) {
            targetRow = this.grid.dimension - 1;
          }
          ignoreWalls = true;
          const blocker = this.getCharacterAt(targetCol, targetRow);
          if (blocker) {
            tryAgainLater.push(e);
            continue;
          } else {
            char.sprite.tint = 0xffffff;
          }
        } else {
          const dijks = this.dijkstra(
            playerCharacter.coords,
            true,
            char.coords,
          );

          // Move in the direction which has the lowest distance
          targetCol = dijks.col[char.coords.col][char.coords.row];
          targetRow = dijks.row[char.coords.col][char.coords.row];

          if (targetCol == null || targetRow == null) {
            const neighbours: Coords[] = [];
            this.addPotentialNeighbour(neighbours, char.coords, 1, 0);
            this.addPotentialNeighbour(neighbours, char.coords, 0, 1);
            this.addPotentialNeighbour(neighbours, char.coords, -1, 0);
            this.addPotentialNeighbour(neighbours, char.coords, 0, -1);
            if (neighbours.length > 0) {
              // If there is no good route, then random direction
              const dir = _.sample(neighbours);
              targetCol = dir.col;
              targetRow = dir.row;
            } else {
              // If there is no route at all, then wait, we'll try again in a bit
              tryAgainLater.push(e);
              continue;
            }
          }
        }

        const dx = targetCol - char.coords.col;
        const dy = targetRow - char.coords.row;
        atLeastOneMove = true;
        delay = Math.max(
          this.moveCharacter(char, dx, dy, ignoreWalls).delay,
          delay,
        );
      }

      if (tryAgainLater.length == 0) {
        break;
      } else {
        sortedEnemies = tryAgainLater;
      }
    }

    return { didMove: true, delay };
  }

  private updateTentativeDistance(
    withEnemiesAsObstacles: boolean,
    tentativeDistance: number[][],
    tentativeSourceCol: number[][],
    tentativeSourceRow: number[][],
    coords: Coords,
    dx: number,
    dy: number,
  ) {
    if (!this.grid.inBounds(coords.col + dx, coords.row + dy)) {
      // Out of bounds, ignore!
      return;
    }
    if (this.grid.dWalls.doesWallSeparate(coords, dx, dy)) {
      // There is no path, ignore!
      return;
    }
    if (withEnemiesAsObstacles) {
      const char = this.getCharacterAt(coords.col + dx, coords.row + dy);
      if (char && char.isEnemy) {
        // There is a monster on the target square, ignore!
        return;
      }
    }
    const newTentativeDistance = tentativeDistance[coords.col][coords.row] + 1;
    if (
      tentativeDistance[coords.col + dx][coords.row + dy] > newTentativeDistance
    ) {
      tentativeDistance[coords.col + dx][coords.row + dy] =
        newTentativeDistance;
      tentativeSourceCol[coords.col + dx][coords.row + dy] = coords.col;
      tentativeSourceRow[coords.col + dx][coords.row + dy] = coords.row;
    }
  }

  private dijkstra(
    target: Coords,
    withEnemiesAsObstacles: boolean,
    stopAt: Coords = null,
  ): { distance: number[][]; col: number[][]; row: number[][] } {
    const current = target.clone();

    const visited: boolean[][] = [];
    const tentativeDistance: number[][] = [];
    const tentativeSourceCol: number[][] = [];
    const tentativeSourceRow: number[][] = [];
    for (let i = 0; i < this.grid.dimension; i++) {
      // col
      const c1 = [];
      const c2 = [];
      const c3 = [];
      const c4 = [];
      for (let j = 0; j < this.grid.dimension; j++) {
        // row
        c1.push(false);
        if (target.row == j && target.col == i) {
          c2.push(0);
        } else {
          c2.push(99999);
        }
        c3.push(null);
        c4.push(null);
      }
      visited.push(c1);
      tentativeDistance.push(c2);
      tentativeSourceCol.push(c3);
      tentativeSourceRow.push(c4);
    }

    do {
      // Consider all unvisited neighbours of `current`
      const utd = (dx: number, dy: number) => {
        this.updateTentativeDistance(
          stopAt && stopAt.equals(current.col + dx, current.row + dy)
            ? false
            : withEnemiesAsObstacles,
          tentativeDistance,
          tentativeSourceCol,
          tentativeSourceRow,
          current,
          dx,
          dy,
        );
      };
      utd(1, 0);
      utd(-1, 0);
      utd(0, -1);
      utd(0, 1);

      // Mark current as visited
      visited[current.col][current.row] = true;

      // Stop if we've connected our two target points
      if (stopAt && stopAt.equals(current)) break;

      let smallestTentativeDistance = 9999999;
      let smallests = [];
      for (let i = 0; i < this.grid.dimension; i++) {
        for (let j = 0; j < this.grid.dimension; j++) {
          if (visited[i][j]) continue;
          if (
            smallests.length == 0 ||
            tentativeDistance[i][j] < smallestTentativeDistance
          ) {
            smallestTentativeDistance = tentativeDistance[i][j];
            smallests = [];
          }
          if (tentativeDistance[i][j] == smallestTentativeDistance) {
            smallests.push([i, j]);
          }
        }
      }

      // If there are no unvisited, we are done
      if (smallests.length == 0) break;

      // Otherwise, set current to unvisited with smallest tentative
      const randomSmallest = _.sample(smallests);
      current.set(randomSmallest[0], randomSmallest[1]);
    } while (true);

    // Return the dijkstra map for the whole grid
    return {
      distance: tentativeDistance,
      col: tentativeSourceCol,
      row: tentativeSourceRow,
    };
  }

  private addPotentialNeighbour(
    list: Coords[],
    coords: Coords,
    dx: number,
    dy: number,
  ) {
    if (!this.grid.inBounds(coords.col + dx, coords.row + dy)) {
      // Out of bounds, ignore!
      return;
    }
    if (this.grid.dWalls.doesWallSeparate(coords, dx, dy)) {
      // There is no path, ignore!
      return;
    }
    const char = this.getCharacterAt(coords.col + dx, coords.row + dy);
    if (char && char.isEnemy) {
      // There is a monster on the target square, ignore!
      return;
    }
    list.push(coords.clone().add(dx, dy));
  }
}

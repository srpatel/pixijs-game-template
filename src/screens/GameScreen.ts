import * as PIXI from "pixi.js";
import { Action, Actions } from "pixi-actions";
import Character from "@/components/Character";
import Grid from "@/components/Grid";
import Screen from "@/screens/Screen";

export default class GameScreen extends Screen {
  grid: Grid;
  playerCharacter: Character;
  listener = this.onKeyDown.bind(this);

  // Game state
  isReadyToMove: boolean = true;
  queuedMove: { dx: number; dy: number };

  constructor() {
    super();

    this.grid = new Grid(5);

    this.grid.dWalls.generateWalls(5);

    this.playerCharacter = new Character("player");
    this.playerCharacter.coords.set(2, 2);
    this.grid.dChars.addCharacter(this.playerCharacter);

    this.addChild(this.grid);
  }

  onKeyDown(event: KeyboardEvent): void {
    // WASD or Arrows, move character
    let dx = 0;
    let dy = 0;
    const code = event.code;
    if (code == "ArrowLeft" || code == "KeyA") {
      dx = -1;
    } else if (code == "ArrowRight" || code == "KeyD") {
      dx = 1;
    } else if (code == "ArrowUp" || code == "KeyW") {
      dy = -1;
    } else if (code == "ArrowDown" || code == "KeyS") {
      dy = 1;
    }

    if (dx != 0 || dy != 0) {
      this.doMove(dx, dy);
    }
  }

  pumpQueuedMove() {
    if (this.queuedMove) {
      this.doMove(this.queuedMove.dx, this.queuedMove.dy);
      this.queuedMove = null;
    }
  }

  doEnemyMove(): void {
    this.isReadyToMove = true;
    this.pumpQueuedMove();
  }

  doMove(dx: number, dy: number): void {
    if (this.isReadyToMove) {
      Actions.clear(this.playerCharacter);
      const moveResult = this.grid.dChars.moveCharacter(this.playerCharacter, dx, dy);

      this.isReadyToMove = false;
      if (moveResult.didMove) {
        // Post move
        Actions.sequence(
          Actions.delay(moveResult.delay),
          Actions.runFunc(() => {
            this.doEnemyMove();
          }),
        ).play();
      } else {
        // After a delay, let the player move again
        Actions.sequence(
          Actions.delay(moveResult.delay),
          Actions.runFunc(() => {
            this.isReadyToMove = true;
            this.pumpQueuedMove();
          }),
        ).play();
      }
    } else {
      this.queuedMove = { dx, dy };
    }
  }

  onAddedToStage(_stage: PIXI.Container): void {
    window.addEventListener("keydown", this.listener);
  }

  onRemovedFromStage(_stage: PIXI.Container): void {
    window.removeEventListener("keydown", this.listener);
  }

  setSize(width: number, height: number) {
    this.grid.position.set(
      (width - this.grid.edgeSize) / 2,
      (height - this.grid.edgeSize) / 2,
    );
  }
}

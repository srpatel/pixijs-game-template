import Grid from "@/components/Grid";
import Screen from "@/screens/Screen";

export default class GameScreen extends Screen {
  grid: Grid;
  constructor() {
    super();

    this.grid = new Grid(5);
    this.addChild(this.grid);
  }

  setSize(width: number, height: number) {
    this.grid.position.set(
      (width - this.grid.edgeSize) / 2, 
      (height - this.grid.edgeSize) / 2
    );
  }
}

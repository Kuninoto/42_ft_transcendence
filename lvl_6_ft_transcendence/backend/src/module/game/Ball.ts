import { CANVAS_LENGTH, CANVAS_HEIGHT } from './GameRoom';

export class Ball {
  constructor() {
    this.x = CANVAS_LENGTH / 2;
    this.y = CANVAS_HEIGHT / 2;
  }

  x: number;
  y: number;
}

export interface IBall {
  x: number;
  y: number;
}

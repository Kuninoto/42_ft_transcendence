import { CANVAS_MID_HEIGHT, CANVAS_MID_WIDTH } from './GameRoom';
import { PADDLE_HEIGHT } from './Player';

export const BALL_RADIUS: number = 4;
const SPEED_CAP: number = 18;
const RANDOM_BALL_SPEED: number = Math.round(Math.random()) % 2 === 0 ? -4 : 4;

export class Ball {
  constructor() {
    this.x = CANVAS_MID_WIDTH;
    this.y = CANVAS_MID_HEIGHT;
    this.speed = { x: RANDOM_BALL_SPEED, y: RANDOM_BALL_SPEED };
  }

  x: number;
  y: number;
  speed: { x: number; y: number };

  moveBySpeed() {
    this.x += this.speed.x;
    this.y += this.speed.y;
  }

  bounceInY() {
    this.speed.y *= -1;
  }

  bounceInX() {
    if (Math.abs(this.speed.x) >= SPEED_CAP) {
      this.speed.x *= -1;
    } else {
      this.speed.x *= -1.1;
    }
  }

  bounceOnCollidePoint(collidePoint: number) {
    this.speed.y =
      (-collidePoint / (PADDLE_HEIGHT / 2)) * 6 + -1 * Math.random() * 2;
  }

  reset() {
    this.x = CANVAS_MID_WIDTH;
    this.y = CANVAS_MID_HEIGHT;
    this.speed = {
      x: RANDOM_BALL_SPEED,
      y: 0,
    };
  }
}

export interface IBall {
  x: number;
  y: number;
}

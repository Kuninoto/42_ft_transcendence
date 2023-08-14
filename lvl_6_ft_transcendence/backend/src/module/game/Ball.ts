import { CANVAS_HEIGHT, CANVAS_MID_HEIGHT, CANVAS_MID_WIDTH } from './GameRoom';
import { PADDLE_HEIGHT } from './Player';

export const BALL_RADIUS: number = 4;
const SPEED_CAP: number = 9;

const randomBallSpeed = () => {
  return Math.round(Math.random()) % 2 === 0 ? -2 : 2;
};

const randomBallStartingHeight = () => {
  return Math.round(Math.random() * CANVAS_HEIGHT);
};

export class Ball {
  constructor() {
    this.x = CANVAS_MID_WIDTH;
    this.y = randomBallStartingHeight();
    this.speed = {
      x: randomBallSpeed(),
      y: randomBallSpeed(),
    };
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
    this.y = randomBallStartingHeight();
    this.speed = {
      x: randomBallSpeed(),
      y: randomBallSpeed(),
    };
  }
}

export interface IBall {
  x: number;
  y: number;
}

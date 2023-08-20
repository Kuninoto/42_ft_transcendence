import { CANVAS_HEIGHT, CANVAS_WIDTH } from './GameRoom';
import { PADDLE_HEIGHT } from './Player';

export const BALL_RADIUS: number = 4;

// 45 degrees
const MAX_BOUNCE_ANGLE: number = 45;
const MAX_BOUNCE_SPEED: number = 12;

const BALL_SPEED: number = 1.5;

const randomBallSpeed = () => {
  return Math.round(Math.random()) % 2 === 0 ? -BALL_SPEED : BALL_SPEED;
};

const randomBallStartingHeight = () => {
  return Math.round(Math.random() * CANVAS_HEIGHT);
};

export class Ball {
  // Ball's x & y represent the coordinates of the ball's center
  constructor() {
    this.x = CANVAS_WIDTH / 2;
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
    this.x += this.speed.x + 0.1;
    this.y += this.speed.y + 0.1;
  }

  bounceInY() {
    this.speed.y *= -1;
  }

  bounceInX() {
    this.speed.x *= -1;
  }

  // Refer to: https://gamedev.stackexchange.com/questions/4253/in-pong-how-do-you-calculate-the-balls-direction-when-it-bounces-off-the-paddl
  bounceOnCollidePoint(collidePoint: number) {
    const normalizedCollidePoint: number = collidePoint / PADDLE_HEIGHT;
    const bounceAngle: number = normalizedCollidePoint * MAX_BOUNCE_ANGLE;
    const bounceSpeed: number = normalizedCollidePoint * MAX_BOUNCE_SPEED;

    //this.speed.x = bounceSpeed * Math.cos(bounceAngle);
    this.bounceInX();
    this.speed.y = bounceSpeed * -Math.sin(bounceAngle);
  }

  reset() {
    this.x = CANVAS_WIDTH / 2;
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

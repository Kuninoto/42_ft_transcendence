import { CANVAS_HEIGHT, CANVAS_WIDTH } from './GameRoom';

export enum BallEdge {
  LEFT,
  RIGHT,
  TOP,
  BOTTOM,
}

export const BALL_RADIUS = 4;

// 45 degrees
const MAX_ANGLE: number = Math.PI / 4;

const BALL_INIT_SPEED = 2;
const MAX_BALL_INIT_SPEED = 3.25;

const randomBallHeight = (): number =>
  Math.round(Math.random() * CANVAS_HEIGHT);

const randomBallAngle = (): number => Math.random() * MAX_ANGLE; // range 0.0-45.0
const randomBallDirection = (): number => (Math.random() > 0.5 ? 1 : -1);

export class Ball {
  speed: { x: number; y: number };
  x: number;
  y: number;

  /* Ball's x & y represent the coordinates of the ball's center
  To consider the ball edges we should add the radius
  e.g left edge = this.x - BALL_RADIUS */
  constructor() {
    this.x = CANVAS_WIDTH / 2;
    this.y = randomBallHeight();

    const angle: number = randomBallAngle();

    this.speed = {
      x:
        Math.round(
          Math.cos(angle) * BALL_INIT_SPEED * randomBallDirection() * 100,
        ) / 100,
      y:
        Math.round(
          Math.sin(angle) * BALL_INIT_SPEED * randomBallDirection() * 100,
        ) / 100,
    };
  }

  bounceInX(): void {
    this.speed.x *= -1;
  }

  bounceInY(): void {
    this.speed.y *= -1;
  }

  bounceOnCollidePoint(collidePoint: number, newDirection: 1 | -1): void {
    const bounceAngle: number = collidePoint * MAX_ANGLE;

    this.speed.x =
      Math.round(
        Math.cos(bounceAngle) * MAX_BALL_INIT_SPEED * newDirection * 100,
      ) / 100;
    this.speed.y =
      Math.round(
        Math.sin(bounceAngle) * MAX_BALL_INIT_SPEED * newDirection * 100,
      ) / 100;
    this.bounceInX();
  }

  moveBySpeed(): void {
    this.x += this.speed.x;
    this.y += this.speed.y;
    this.normalizeSpeed();
  }

  normalizeSpeed(): void {
    const speedMagnitude: number = Math.sqrt(
      this.speed.x * this.speed.x + this.speed.y * this.speed.y,
    );

    if (speedMagnitude > MAX_BALL_INIT_SPEED) {
      this.speed.x = (this.speed.x / speedMagnitude) * MAX_BALL_INIT_SPEED;
      this.speed.y = (this.speed.y / speedMagnitude) * MAX_BALL_INIT_SPEED;
    }
  }

  reset(): void {
    this.x = CANVAS_WIDTH / 2;
    this.y = randomBallHeight();

    const angle: number = randomBallAngle();

    this.speed = {
      x:
        Math.round(
          BALL_INIT_SPEED * Math.cos(angle) * randomBallDirection() * 100,
        ) / 100,
      y:
        Math.round(
          BALL_INIT_SPEED * Math.sin(angle) * randomBallDirection() * 100,
        ) / 100,
    };
  }

  getEdge(edge: BallEdge): number {
    if (edge === BallEdge.LEFT) return this.x - BALL_RADIUS;
    if (edge === BallEdge.RIGHT) return this.x + BALL_RADIUS;
    if (edge === BallEdge.TOP) return this.y - BALL_RADIUS;
    if (edge === BallEdge.BOTTOM) return this.y + BALL_RADIUS;
  }
}

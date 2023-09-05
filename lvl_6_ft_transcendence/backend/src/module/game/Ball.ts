import { CANVAS_HEIGHT, CANVAS_WIDTH } from './GameRoom';
import { PADDLE_HEIGHT } from './Player';

export const BALL_RADIUS = 4;

const MAX_BOUNCE_SPEED = 8.5;

// 45 degrees
const ANGLE: number = Math.PI / 4;

const BALL_SPEED: number = 2.5;
const BALL_SPEED_INCREASE: number = 0.3;

const randomBallStartingHeight = (): number => {
  return Math.round(Math.random() * CANVAS_HEIGHT);
};

const randomBallAngle = (): number => {
  return Math.random() * ANGLE; // range 0.0-45.0
};

export class Ball {
  speed: { x: number; y: number };
  x: number;
  y: number;

  // Ball's x & y represent the coordinates of the ball's center
  constructor() {
    this.x = CANVAS_WIDTH / 2;
    this.y = randomBallStartingHeight();

    const angle: number = randomBallAngle();

    this.speed = {
      x: BALL_SPEED * Math.cos(angle),
      y: BALL_SPEED * Math.sin(angle),
    };
  }

  bounceInX(): void {
    this.speed.x *= -1;
  }

  bounceInY(): void {
    this.speed.y *= -1;
  }

  // Refer to: https://gamedev.stackexchange.com/questions/4253/in-pong-how-do-you-calculate-the-balls-direction-when-it-bounces-off-the-paddl
  bounceOnCollidePoint(collidePoint: number): void {
    const normalizedCollidePoint: number = collidePoint / PADDLE_HEIGHT;
    const bounceAngle: number = normalizedCollidePoint * ANGLE;
    const bounceSpeed: number = normalizedCollidePoint * MAX_BOUNCE_SPEED;

    //this.speed.x = bounceSpeed * Math.cos(bounceAngle);
    this.bounceInX();
    this.speed.y = bounceSpeed * -Math.sin(bounceAngle);
  }

  moveBySpeed(): void {
    this.x += this.speed.x + BALL_SPEED_INCREASE;
    this.y += this.speed.y + BALL_SPEED_INCREASE;
  }

  reset(): void {
    this.x = CANVAS_WIDTH / 2;
    this.y = randomBallStartingHeight();

    const angle: number = randomBallAngle();

    this.speed = {
      x: BALL_SPEED * Math.cos(angle),
      y: BALL_SPEED * Math.sin(angle),
    };
  }
}

import { PlayerSide } from 'types';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './GameRoom';

export const PADDLE_HEIGHT = 80;
export const PADDLE_WIDTH = 10;
const PADDLE_WALL_OFFSET = 16;

export class Player {
  userId: number;
  socketId: string;
  isReady: boolean;
  paddleX: number;
  paddleY: number;
  score: number;
  side: PlayerSide;

  // Paddle's x & y represent the coordinates of the paddle's center
  constructor(userId: number, socketId: string) {
    this.paddleY = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    // PaddleX is later assigned based
    // on the side the player is assigned

    this.userId = userId;
    this.socketId = socketId;

    this.score = 0;
    this.isReady = false;
  }

  setPlayerSide(side: PlayerSide): void {
    this.side = side;
    this.paddleX =
      side === PlayerSide.LEFT
        ? PADDLE_WALL_OFFSET
        : CANVAS_WIDTH - PADDLE_WIDTH - PADDLE_WALL_OFFSET;
  }
}

import { CANVAS_MID_HEIGHT, CANVAS_WIDTH } from './GameRoom';
import { Socket } from 'socket.io';
import { PlayerSide } from 'src/common/types/player-side.enum';

export const PADDLE_HEIGHT: number = 80;
export const PADDLE_WIDTH: number = 10;
export const PADDLE_WALL_OFFSET: number = 16;
export const PADDLE_VELOCITY: number = 6;

export const MAX_SCORE: number = 11;

export class Player {
  constructor(client: Socket, userId: number) {
    this.paddleY = CANVAS_MID_HEIGHT - PADDLE_HEIGHT / 2;
    // PaddleX is later assigned based
    // on the side he's assigned

    this.client = client;
    this.userId = userId;

    this.score = 0;
    this.isReady = false;
  }
  paddleX: number;
  paddleY: number;
  client: Socket;
  userId: number;
  score: number;
  side: PlayerSide;
  isReady: boolean;

  setPlayerSide(side: PlayerSide): void {
    this.side = side;
    this.paddleX =
      side === PlayerSide.LEFT
        ? PADDLE_WALL_OFFSET
        : CANVAS_WIDTH - PADDLE_WIDTH - PADDLE_WALL_OFFSET;
  }
}

export interface IPlayer {
  paddleY: number;
}

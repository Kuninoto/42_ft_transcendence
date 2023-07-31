import { Socket } from 'socket.io';
import { GameType } from 'src/common/types/game-type.enum';
import { PlayerSide } from 'src/common/types/player-side.enum';

export const PADDLE_VELOCITY: number = 6;
export const CANVAS_HEIGHT: number = 400;
export const CANVAS_LENGTH: number = 800;

const PADDLE_HEIGHT: number = 80;

export class Ball {
  constructor() {
    this.x = CANVAS_LENGTH / 2;
    this.y = CANVAS_HEIGHT / 2;
  }

  x: number;
  y: number;
}

export class Player {
  constructor(client: Socket, userId: number) {
    this.paddleY = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    this.client = client;
    this.userId = userId;
    this.score = 0;
    this.isReady = false;
  }
  paddleY: number;
  client: Socket;
  userId: number;
  score: number;
  side: PlayerSide;
  isReady: boolean;
}

export interface GameRoom {
  roomId: string;
  gameType: GameType;
  ball: Ball;
  leftPlayer: Player;
  rightPlayer: Player;
}

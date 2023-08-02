import { CANVAS_HEIGHT } from './GameRoom';
import { Socket } from 'socket.io';
import { PlayerSide } from 'src/common/types/player-side.enum';

export const PADDLE_VELOCITY: number = 6;
const PADDLE_HEIGHT: number = 80;

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

export interface IPlayer {
  paddleY: number;
  score: number;
}

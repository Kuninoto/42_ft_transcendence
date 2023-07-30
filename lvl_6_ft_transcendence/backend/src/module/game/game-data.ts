import { Socket } from 'socket.io';

export const CANVAS_LENGTH: number = 800;
export const CANVAS_HEIGHT: number = 400;

export class Ball {
  constructor(initialX: number, initialY: number) {
    this.x = initialX;
    this.y = initialY;
  }

  x: number;
  y: number;
}

export class Player {
  constructor(client: Socket, userId: number) {
    this.paddleY = CANVAS_HEIGHT / 2;
    this.client = client;
    this.userId = userId;
  }
  paddleY: number;
  client: Socket;
  userId: number;
}

export interface gameData {
  roomId: string;
  ball: Ball;
  leftPlayer: Player;
  rightPlayer: Player;
}

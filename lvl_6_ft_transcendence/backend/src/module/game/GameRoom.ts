import { GameType } from 'types';
import { Ball } from './Ball';
import { Player } from './Player';

export const CANVAS_HEIGHT: number = 400;
export const CANVAS_MID_HEIGHT: number = 200;
export const CANVAS_HEIGHT_OFFSET: number = 80;

export const CANVAS_WIDTH: number = 800;
export const CANVAS_MID_WIDTH: number = 400;

export interface GameRoom {
  roomId: string;
  gameLoopIntervalId?: NodeJS.Timeout;
  gameType: GameType;
  ball: Ball;
  leftPlayer: Player;
  rightPlayer: Player;
}

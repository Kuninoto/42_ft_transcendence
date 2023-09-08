import { GameType } from 'types';
import { Ball } from './Ball';
import { Player } from './Player';

export const CANVAS_WIDTH: number = 800;
export const CANVAS_HEIGHT: number = 400;
export const CANVAS_HEIGHT_OFFSET: number = 80;

export const MAX_SCORE = 11;

export interface GameRoom {
  roomId: string;
  gameType: GameType;
  gameLoopIntervalId?: NodeJS.Timeout;
  syncGameRoomIntervalId?: NodeJS.Timeout;
  ball: Ball;
  leftPlayer: Player;
  rightPlayer: Player;
}

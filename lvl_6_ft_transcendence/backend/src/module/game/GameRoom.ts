import { GameType } from 'types';

import { Ball } from './Ball';
import { Player } from './Player';

export const CANVAS_HEIGHT = 400;
export const CANVAS_HEIGHT_OFFSET = 80;

export const CANVAS_WIDTH = 800;

export interface GameRoom {
  ball: Ball;
  gameLoopIntervalId?: NodeJS.Timeout;
  gameType: GameType;
  leftPlayer: Player;
  rightPlayer: Player;
  roomId: string;
}

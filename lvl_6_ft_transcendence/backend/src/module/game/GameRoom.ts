import { GameType } from 'src/common/types/game-type.enum';
import { Player, IPlayer } from 'src/module/game/Player';
import { Ball, IBall } from 'src/module/game/Ball';

export const CANVAS_HEIGHT: number = 400;
export const CANVAS_MID_HEIGHT: number = 200;
export const CANVAS_HEIGHT_OFFSET: number = 80;

export const CANVAS_WIDTH: number = 800;
export const CANVAS_MID_WIDTH: number = 400;

export const GAME_START_TIMEOUT: number = 10;

export interface GameRoom {
  roomId: string;
  gameLoopIntervalId?: NodeJS.Timer;
  listenForPaddleMoveMessagesIntervalId?: NodeJS.Timer;
  gameType: GameType;
  ball: Ball;
  leftPlayer: Player;
  rightPlayer: Player;
}

export interface GameRoomInfoDTO {
  ball: IBall;
  leftPlayer: IPlayer;
  rightPlayer: IPlayer;
}

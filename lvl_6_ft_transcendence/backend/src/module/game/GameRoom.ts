import { GameType } from 'src/common/types/game-type.enum';
import { Player, IPlayer } from 'src/module/game/Player';
import { Ball, IBall } from 'src/module/game/Ball';

export const CANVAS_HEIGHT: number = 400;
export const CANVAS_HEIGHT_OFFSET: number = 80;

export const CANVAS_LENGTH: number = 800;

export const MAX_SCORE: number = 11;

export interface GameRoom {
  roomId: string;
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

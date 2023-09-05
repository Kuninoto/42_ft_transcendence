import { IBall } from "src/module/game/Ball";
import { IPlayer } from "src/module/game/Player";

export interface GameRoomInfoEvent {
  ball: IBall;
  leftPlayer: IPlayer;
  rightPlayer: IPlayer;
}
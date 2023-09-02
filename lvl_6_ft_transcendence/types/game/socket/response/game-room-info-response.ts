import { IBall } from "src/module/game/Ball";
import { IPlayer } from "src/module/game/Player";

export interface GameRoomInfoResponse {
  ball: IBall;
  leftPlayer: IPlayer;
  rightPlayer: IPlayer;
}

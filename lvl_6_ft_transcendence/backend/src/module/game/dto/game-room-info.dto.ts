import { IBall } from "../Ball";
import { IPlayer } from "../Player";

export interface GameRoomInfoDTO {
  ball: IBall;
  leftPlayer: IPlayer;
  rightPlayer: IPlayer;
}

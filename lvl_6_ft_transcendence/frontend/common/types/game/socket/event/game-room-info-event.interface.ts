import { IBall, IPlayer } from "@/common/types";

export interface GameRoomInfoEvent {
  readonly ball: IBall;
  readonly leftPlayer: IPlayer;
  readonly rightPlayer: IPlayer;
}

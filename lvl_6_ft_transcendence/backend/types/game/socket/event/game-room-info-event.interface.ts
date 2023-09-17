import { IBall, IPlayer } from 'types';

export interface GameRoomInfoEvent {
  ball: IBall;
  leftPlayer: IPlayer;
  rightPlayer: IPlayer;
}

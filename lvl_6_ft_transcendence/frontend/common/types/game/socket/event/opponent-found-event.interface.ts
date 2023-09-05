import { OpponentInfo, PlayerSide } from 'types';

export interface OpponentFoundEvent {
  roomId: string;
  side: PlayerSide;
  opponentInfo: OpponentInfo;
}

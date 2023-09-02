import { OpponentInfo, PlayerSide } from 'types';

export interface OpponentFoundResponse {
  opponentInfo: OpponentInfo;
  roomId: string;
  side: PlayerSide;
}

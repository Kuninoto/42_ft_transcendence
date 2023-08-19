import { OpponentInfo, PlayerSide } from 'types';

export interface OpponentFoundDTO {
  roomId: string;
  side: PlayerSide;
  opponentInfo: OpponentInfo;
}

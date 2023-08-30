import { OpponentInfo, PlayerSide } from 'types';

export interface OpponentFoundDTO {
  opponentInfo: OpponentInfo;
  roomId: string;
  side: PlayerSide;
}

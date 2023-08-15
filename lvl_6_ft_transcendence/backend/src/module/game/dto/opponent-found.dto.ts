import { OpponentInfo } from 'src/common/types/opponent-info.interface';
import { PlayerSide } from 'src/common/types/player-side.enum';

export interface OpponentFoundDTO {
  roomId: string;
  side: PlayerSide;
  opponentInfo: OpponentInfo;
}

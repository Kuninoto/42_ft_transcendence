import { PlayerSide } from 'src/common/types/player-side.enum';
import { UserSearchInfo } from 'src/common/types/user-search-info.interface';

export interface OpponentFoundDTO {
  roomId: string;
  side: PlayerSide;
  opponentInfo: UserSearchInfo;
}

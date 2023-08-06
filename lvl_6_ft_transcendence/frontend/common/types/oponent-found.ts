import { PlayerSide } from "./backend/player-side.enum";
import { UserSearchInfo } from "./backend/user-search-info.interface";

export interface OponentFoundDTO {
    roomId: string;
    side: PlayerSide;
    opponentInfo: UserSearchInfo;
}
import { PlayerSide, UserSearchInfo } from './backend'

export interface OponentFoundDTO {
	opponentInfo: UserSearchInfo
	roomId: string
	side: PlayerSide
}


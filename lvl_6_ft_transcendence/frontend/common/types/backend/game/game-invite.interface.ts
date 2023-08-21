import { Player } from '../../game-room-info'

export interface GameInvite {
	recipientUID: number
	sender: Player
}

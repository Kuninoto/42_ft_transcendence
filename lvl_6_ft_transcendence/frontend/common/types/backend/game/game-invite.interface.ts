import { Player } from 'src/module/game/Player'

export interface GameInvite {
	recipientUID: number
	sender: Player
}

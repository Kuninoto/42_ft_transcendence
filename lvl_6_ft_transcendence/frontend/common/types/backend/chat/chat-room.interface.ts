import { Chatter } from './chatter.interface'

export interface ChatRoomInterface {
	ownerName: string
	participants: Chatter[]
	roomId: number
	roomName: string
}

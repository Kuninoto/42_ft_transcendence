import { Chatter } from './chatter.interface'

export interface ChatRoomInterface {
	id: number
	name: string
	ownerId: number
	participants: Chatter[]
}

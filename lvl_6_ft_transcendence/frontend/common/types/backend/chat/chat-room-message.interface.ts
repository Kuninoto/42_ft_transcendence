import { Chatter } from './chatter.interface'

export interface ChatRoomMessage {
	author: Chatter
	content: string
	uniqueId: string
}

import { Chatter } from './backend'

export interface RoomMessageReceivedDTO {
	author: Chatter
	content: string
	id: number
	uniqueId: string
}

import { Chatter } from '../../chatter.interface'

export interface RoomMessageReceivedEvent {
	readonly author: Chatter
	readonly content: string
	readonly id: number
	readonly uniqueId: string
}

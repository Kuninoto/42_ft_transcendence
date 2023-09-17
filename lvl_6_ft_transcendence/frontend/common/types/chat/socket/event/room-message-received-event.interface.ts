import { UserBasicProfile } from 'types/user'

export interface RoomMessageReceivedEvent {
	readonly uniqueId: string
	readonly id: number
	readonly author: UserBasicProfile
	readonly content: string
	readonly sentAt: Date
}

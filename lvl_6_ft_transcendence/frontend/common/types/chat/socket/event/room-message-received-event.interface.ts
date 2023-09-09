import { UserBasicProfile } from '@/common/types/user'

export interface RoomMessageReceivedEvent {
	readonly author: UserBasicProfile
	readonly content: string
	readonly id: number
	readonly uniqueId: string
}

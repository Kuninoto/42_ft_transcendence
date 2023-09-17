import { UserBasicProfile } from '@/common/types/user'

export interface DirectMessageReceivedEvent {
	author: UserBasicProfile
	content: string
	uniqueId: string
}

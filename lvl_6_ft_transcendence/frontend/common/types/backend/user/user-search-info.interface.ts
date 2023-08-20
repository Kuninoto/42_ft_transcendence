import { FriendshipStatus } from '../friendship/friendship-status.enum'

export interface UserSearchInfo {
	avatar_url: string
	friend_request_sent_by_me: boolean | null
	friendship_status: FriendshipStatus | null
	id: number
	name: string
}

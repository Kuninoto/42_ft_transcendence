import { GameResultInterface } from 'types/game'

import { AchievementInterface } from '../achievement/achievement-interface.interface'
import { Friend } from '../friendship/friend.interface'
import { FriendshipStatus } from '../friendship/friendship-status.enum'
import { UserStatsInterface } from '../user-stats/user-stats-interface.interface'

export interface UserProfile {
	achievements: AchievementInterface[]
	avatar_url: string
	blocked_by_me: boolean
	created_at: Date
	friend_request_sent_by_me: boolean | null
	friends: Friend[]
	friendship_id: null | number
	friendship_status: FriendshipStatus | null
	has_2fa: boolean
	id: number
	intra_name: string
	intra_profile_url: string
	ladder_level: number
	match_history: GameResultInterface[]
	name: string
	stats: UserStatsInterface
}

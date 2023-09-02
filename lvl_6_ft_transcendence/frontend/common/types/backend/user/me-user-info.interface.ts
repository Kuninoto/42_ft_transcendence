import { UserStatsInterface } from '../user-stats'

export interface MeUserInfo {
	avatar_url: string
	created_at: Date
	game_theme: string
	has_2fa: boolean
	id: number
	intra_name: string
	intra_profile_url: string
	ladder_level: number
	name: string
	stats: UserStatsInterface
}

/* 
* Global purpose interfaces
*/
type BaseUserInfo = {
    avatar_url: string
    name: string
}

export interface SearchUserInfo extends BaseUserInfo {
	id: number,
}

export interface Friend extends BaseUserInfo {
    uid: number
	friendship_id: number
	status: string
}

export interface User {
	id?: number
	avatar_url?: string
	intra_profile_url?: string
	created_at?: Date
	has_2fa?: boolean
	name?: string
	blocked_users?: []
	friends? : []
	friend_requests?: []
}

/* 
* Auth purpose interfaces
*/
export interface AuthContextExports {
	login: (code: string) => Promise<boolean> | void
	logout: () => void
	user: User
}
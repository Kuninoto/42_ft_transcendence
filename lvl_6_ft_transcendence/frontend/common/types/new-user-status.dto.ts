import { UserStatus } from './backend'

export interface NewUserStatusDTO {
	newStatus: UserStatus
	uid: number
}

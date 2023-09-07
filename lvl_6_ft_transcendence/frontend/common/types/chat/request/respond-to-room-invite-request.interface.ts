import { UUID } from 'crypto'

export interface RespondToRoomInviteRequest {
	readonly accepted: boolean
	readonly inviteId: UUID
}

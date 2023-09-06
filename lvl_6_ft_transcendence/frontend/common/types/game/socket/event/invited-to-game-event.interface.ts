import { UUID } from 'crypto'

export interface InvitedToGameEvent {
	readonly inviteId: UUID
	readonly inviterUID: number
}

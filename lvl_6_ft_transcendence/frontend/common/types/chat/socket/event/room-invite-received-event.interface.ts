<<<<<<< HEAD
export interface RoomInviteReceivedEvent {
	inviteId: string
=======
import { UUID } from 'crypto'

export interface RoomInviteReceivedEvent {
	inviteId: UUID
>>>>>>> 6187eedf92007390effd96fd17a1413ee4c8da70
	inviterUID: number
	roomName: string
}

import { ChatRoomRoles } from './chat-room-roles.enum'
import { Chatter } from './chatter.interface'

export interface ChatRoomInterface {
	id: number
	myRole: ChatRoomRoles
	name: string
	ownerName: string
	participants: Chatter[]
}

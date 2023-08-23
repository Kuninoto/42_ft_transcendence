import { ChatRoomType } from './backend'

export interface CreateRoomDTO {
	name: string
	password?: string
	type: ChatRoomType
}

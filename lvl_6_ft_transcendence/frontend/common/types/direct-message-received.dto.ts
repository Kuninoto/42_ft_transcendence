import { Chatter } from './backend'

export interface DirectMessageReceivedDTO {
	author: Chatter
	content: string
	uniqueId: string
}

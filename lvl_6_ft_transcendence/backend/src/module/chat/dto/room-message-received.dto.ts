import { Chatter } from 'types';

export interface RoomMessageReceivedDTO {
	uniqueId: string;
	author: Chatter;
	content: string;
	id: number;
}

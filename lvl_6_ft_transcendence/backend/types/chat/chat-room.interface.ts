import { Chatter } from './chatter.interface';

export interface ChatRoomInterface {
	id: number;
	name: string;
	ownerName: string;
	participants: Chatter[];
}

import { UUID } from "crypto";

export interface RoomInviteReceivedEvent {
	inviteId: UUID;
	inviterUID: number;
	roomName: string;
}

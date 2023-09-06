import { UUID } from "crypto";

export interface RoomInviteReceivedEvent {
  inviteId: UUID;
  inviterUID: number;
  roomId: number;
  roomName: string;
}

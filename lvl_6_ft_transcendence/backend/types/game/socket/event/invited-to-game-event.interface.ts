import { UUID } from "crypto";

export interface InvitedToGameEvent {
  inviteId: UUID;
  inviterUID: number;
}

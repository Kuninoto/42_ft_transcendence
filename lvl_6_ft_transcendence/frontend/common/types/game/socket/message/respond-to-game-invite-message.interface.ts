import { UUID } from "crypto";

export interface RespondToGameInviteMessage {
  inviteId: UUID;
  accepted: boolean;
}

import { UUID } from "crypto";

export interface RespondToGameInviteMessage {
  readonly inviteId: UUID;
  readonly accepted: boolean;
}

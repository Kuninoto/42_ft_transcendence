import { UUID } from 'crypto';

export interface RespondToRoomInviteRequest {
  readonly inviteId: UUID;
  readonly accepted: boolean;
}

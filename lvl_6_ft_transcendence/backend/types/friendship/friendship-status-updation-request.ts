import { FriendshipStatus } from './friendship-status.enum';

export interface FriendshipStatusUpdationRequest {
  newStatus: FriendshipStatus;
}

import { FriendshipStatus } from './friendship-status.enum';

export interface UserSearchInfo {
  id: number;
  name: string;
  avatar_url: string;
  friendship_status: FriendshipStatus | null;
  friend_request_sent_by_me: boolean | null;
}

import { FriendshipStatus } from './friendship-status.enum';
import { FriendInterface } from './friend-interface.interface';
import { UserStatsInterface } from './user-stats-interface.interface';
import { AchievementInterface } from './achievement-interface.interface';

export interface UserProfile {
  id: number;
  name: string;
  avatar_url: string;
  intra_name: string;
  intra_profile_url: string;
  created_at: Date;
  friends: FriendInterface[];
  friendship_id: number | null;
  friendship_status: FriendshipStatus | null;
  friend_request_sent_by_me: boolean | null;
  is_blocked: boolean;
  stats: UserStatsInterface;
  achievements: AchievementInterface[];
}

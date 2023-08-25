import { GameResultInterface } from 'types/game';
import { AchievementInterface } from '../achievement/achievement-interface.interface';
import { Friend } from '../friendship/friend.interface';
import { FriendshipStatus } from '../friendship/friendship-status.enum';
import { UserStatsInterface } from '../user-stats/user-stats-interface.interface';

export interface UserProfile {
  id: number;
  name: string;
  intra_name: string;
  avatar_url: string;
  intra_profile_url: string;
  friends: Friend[];
  friendship_id: number | null;
  friendship_status: FriendshipStatus | null;
  friend_request_sent_by_me: boolean | null;
  blocked_by_me: boolean;
  ladder_level: number;
  match_history: GameResultInterface[];
  stats: UserStatsInterface;
  achievements: AchievementInterface[];
  created_at: Date;
}

import { AchievementInterface } from './achievement-interface.interface';
import { Friend } from './friend-interface.interface';
import { FriendshipStatus } from './friendship-status.enum';
import { GameResult } from './game-result-interface.interface';
import { UserStatsInterface } from './user-stats-interface.interface';

export interface UserProfile {
  id: number;
  name: string;
  avatar_url: string;
  intra_name: string;
  intra_profile_url: string;
  created_at: Date;
  friends: Friend[];
  friendship_id: number | null;
  friendship_status: FriendshipStatus | null;
  friend_request_sent_by_me: boolean | null;
  is_blocked: boolean;
  match_history: GameResult[];
  stats: UserStatsInterface;
  achievements: AchievementInterface[];
}

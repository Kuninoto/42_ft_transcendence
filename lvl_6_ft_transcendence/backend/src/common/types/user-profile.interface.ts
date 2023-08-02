import { FriendshipStatus } from './friendship-status.enum';
import { UserStats } from 'src/entity/user-stats.entity';
import { FriendInterface } from './friend-interface.interface';

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
  is_blocked: boolean;
  stats: UserStats;
}

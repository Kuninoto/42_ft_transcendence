import { FriendshipStatus } from './friendship-status.enum';
import { UserRecord } from 'src/entity/user-record.entity';
import { Friendship } from 'src/typeorm';
import { FriendInterface } from './friend-interface.interface';

export interface UserProfile {
  id: number;
  name: string;
  avatar_url: string;
  intra_profile_url: string;
  created_at: Date;
  friends: FriendInterface[];
  friendship_status: FriendshipStatus | null;
  is_blocked: boolean;
  record: UserRecord;
}

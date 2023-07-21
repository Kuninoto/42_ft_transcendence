import { UserRecord } from 'src/entity/user-record.entity';

export interface UserProfile {
  id: number;
  name: string;
  avatar_url: string;
  intra_profile_url: string;
  created_at: Date;
  record: UserRecord;
}
import { UserBasicProfile } from '@/common/types/user';

export interface DirectMessageReceivedEvent {
  uniqueId: string;
  author: UserBasicProfile;
  content: string;
}

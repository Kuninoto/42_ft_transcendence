import { UserBasicProfile } from 'types/user';

export interface DirectMessageReceivedEvent {
  uniqueId: string;
  author: UserBasicProfile;
  content: string;
  sentAt: Date;
}

import { Chatter } from 'types';

export interface DirectMessageReceivedResponse {
  uniqueId: string;
  author: Chatter;
  content: string;
}

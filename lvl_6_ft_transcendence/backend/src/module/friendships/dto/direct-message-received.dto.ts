import { Chatter } from 'types';

export interface DirectMessageReceivedDTO {
  uniqueId: string;
  author: Chatter;
  content: string;
}

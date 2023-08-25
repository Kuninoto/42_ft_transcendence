import { Chatter } from 'types';

export interface MessageReceivedDTO {
  uniqueId: string;
  author: Chatter;
  content: string;
}

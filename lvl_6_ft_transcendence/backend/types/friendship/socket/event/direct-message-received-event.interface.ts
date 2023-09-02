import { Chatter } from '../../../chat/chatter.interface';

export interface DirectMessageReceivedEvent {
  uniqueId: string;
  author: Chatter;
  content: string;
}

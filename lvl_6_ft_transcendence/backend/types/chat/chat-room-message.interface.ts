import { Author } from './chatter.interface';

export interface ChatRoomMessage {
  author: Author;
  content: string;
}

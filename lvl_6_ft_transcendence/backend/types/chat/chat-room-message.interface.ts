import { Author } from "./author.interface";

export interface ChatRoomMessage {
  author: Author;
  content: string;
}

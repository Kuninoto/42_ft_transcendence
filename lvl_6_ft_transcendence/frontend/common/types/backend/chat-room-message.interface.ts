import { UserI } from './user.interface';

export interface ChatRoomMessageI {
  user: UserI;
  text: string;
}

import { UserBasicProfile } from 'types/user';

export interface ChatRoomInterface {
  id: number;
  name: string;
  ownerId: number;
  participants: UserBasicProfile[];
}

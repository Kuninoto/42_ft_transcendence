import { ChatRoomType } from 'types';

export interface CreateRoomDTO {
  readonly name: string;
  readonly room_type: ChatRoomType;
  readonly password?: string;
}

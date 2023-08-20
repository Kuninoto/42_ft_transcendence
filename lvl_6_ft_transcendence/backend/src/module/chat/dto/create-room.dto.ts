import { ChatRoomType } from 'types';

export interface CreateRoomDTO {
  readonly name: string;
  readonly password?: string;
  readonly type: ChatRoomType;
}

import { ChatRoomType } from 'types';

export interface CreateRoomDTO {
  readonly name: string;
  readonly type: ChatRoomType;
  readonly password?: string;
}

import { ChatRoomType } from 'types';

export interface CreateRoomRequest {
  readonly name: string;
  readonly password?: string;
  readonly type: ChatRoomType;
}

import { ChatRoomType } from 'types';

export interface RoomInviteDTO {
  readonly inviterId: number;
  readonly roomName: string;
  readonly roomType: ChatRoomType;
}

import { ChatRoomRoles } from '../../chat-room-roles.enum';

export interface GetChatterRoleEvent {
  readonly myRole: ChatRoomRoles;
  readonly authorRole: ChatRoomRoles;
}

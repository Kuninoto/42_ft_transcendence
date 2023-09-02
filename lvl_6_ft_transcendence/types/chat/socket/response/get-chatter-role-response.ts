import { ChatRoomRoles } from '../../chat-room-roles.enum';

export interface GetChatterRoleResponse {
  readonly myRole: ChatRoomRoles;
  readonly authorRole: ChatRoomRoles;
}

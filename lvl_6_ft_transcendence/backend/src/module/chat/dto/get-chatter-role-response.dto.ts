import { ChatRoomRoles } from "types/chat/chat-room-roles.enum";

export interface GetChatterRoleResponseDTO {
  myRole: ChatRoomRoles,
  authorRole: ChatRoomRoles,
}

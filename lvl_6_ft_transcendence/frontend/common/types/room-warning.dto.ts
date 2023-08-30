import { RoomWarningType } from "./backend/chat/room-warning.enum";

export interface RoomWarningDTO {
  roomId: number;
  affectedUID: number;
  warning: string;
  warningType: RoomWarningType;
}
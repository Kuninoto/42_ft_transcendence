import { UUID } from "crypto";

export interface PaddleMoveMessage {
  readonly gameRoomId: UUID;
  readonly newY: number;
}

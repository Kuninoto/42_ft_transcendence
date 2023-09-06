import { UUID } from "crypto";

export interface PlayerReadyMessage {
  readonly gameRoomId: UUID;
}

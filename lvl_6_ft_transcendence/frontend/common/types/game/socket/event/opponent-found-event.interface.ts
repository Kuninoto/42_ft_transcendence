import { PlayerSide } from "@/common/types";
import { OpponentInfo } from "../../opponent-info.interface";

export interface OpponentFoundEvent {
  readonly roomId: string;
  readonly side: PlayerSide;
  readonly opponentInfo: OpponentInfo;
}

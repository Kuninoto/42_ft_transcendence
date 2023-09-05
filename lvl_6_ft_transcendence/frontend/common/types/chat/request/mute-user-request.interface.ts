import { MuteDuration } from "../mute-duration.enum";

export interface MuteUserRequest {
  readonly roomId: number;
  readonly userId: number;
  readonly duration: MuteDuration;
}

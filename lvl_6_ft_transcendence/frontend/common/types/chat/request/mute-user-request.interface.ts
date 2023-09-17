import { MuteDuration } from "../mute-duration.enum";

export interface MuteUserRequest {
  readonly userId: number;
  readonly duration: MuteDuration;
}

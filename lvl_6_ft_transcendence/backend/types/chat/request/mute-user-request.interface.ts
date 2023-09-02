import { MuteDuration } from 'types';

export interface MuteUserRequest {
  readonly roomId: number;
  readonly userId: number;
  readonly duration: MuteDuration;
}

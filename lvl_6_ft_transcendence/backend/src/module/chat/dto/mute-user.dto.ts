import { MuteDuration } from 'types';

export interface MuteUserDTO {
  readonly userId: number;
  readonly roomId: number;
  readonly duration: MuteDuration;
}

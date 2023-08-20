import { MuteDuration } from 'types';

export interface MuteUserDTO {
  readonly duration: MuteDuration;
  readonly roomId: number;
  readonly userId: number;
}

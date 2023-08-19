import { MuteDuration } from 'types';

export interface MuteUserDTO {
  readonly userId: string;
  readonly roomId: string;
  readonly duration: MuteDuration;
}

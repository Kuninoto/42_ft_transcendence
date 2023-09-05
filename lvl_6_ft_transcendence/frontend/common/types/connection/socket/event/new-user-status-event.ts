import { UserStatus } from '../../../user/user-status.enum';

export interface NewUserStatusEvent {
  readonly uid: number;
  readonly newStatus: UserStatus;
}

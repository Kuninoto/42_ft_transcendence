import { UserStatus } from '../../../user/user-status.enum';

export interface NewUserStatusEvent {
  uid: number;
  newStatus: UserStatus;
}

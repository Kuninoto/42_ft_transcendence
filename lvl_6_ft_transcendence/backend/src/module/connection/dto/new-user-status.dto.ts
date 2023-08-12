import { UserStatus } from 'src/common/types/user-status.enum';

export interface NewUserStatusDTO {
  uid: number;
  newStatus: UserStatus;
}

import { RoomWarning } from 'types';

export interface RoomWarningDTO {
  roomId: number;
  affectedUID: number;
  warning: string;
  warningType: RoomWarning;
}

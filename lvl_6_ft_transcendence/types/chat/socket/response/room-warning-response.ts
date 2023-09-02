import { RoomWarning } from '../../room-warning.enum';

export interface RoomWarningResponse {
  readonly roomId: number;
  readonly affectedUID: number;
  readonly warning: string;
  readonly warningType: RoomWarning;
}

import { PlayerSide, UserBasicProfile } from 'types';

export interface OpponentFoundEvent {
  roomId: string;
  side: PlayerSide;
  opponentInfo: UserBasicProfile;
}

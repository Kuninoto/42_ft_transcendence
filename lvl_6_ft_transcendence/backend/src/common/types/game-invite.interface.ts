import { Player } from 'src/module/game/Player';

export interface GameInvite {
  roomId: string;
  sender: Player;
  recipientUID: number;
}

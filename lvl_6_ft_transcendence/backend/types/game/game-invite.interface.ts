import { Player } from 'src/module/game/Player';

export interface GameInvite {
  id: string;
  sender: Player;
  recipientUID: number;
}

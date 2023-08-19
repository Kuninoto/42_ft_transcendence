import { Player } from 'src/module/game/Player';

export interface GameInvite {
  sender: Player;
  recipientUID: number;
}

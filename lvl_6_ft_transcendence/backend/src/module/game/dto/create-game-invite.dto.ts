import { Player } from '../Player';

export interface CreateGameInviteDTO {
  recipientUID: number;
  sender: Player;
}

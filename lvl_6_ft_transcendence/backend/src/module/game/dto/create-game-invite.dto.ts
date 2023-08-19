import { Player } from '../Player';

export interface CreateGameInviteDTO {
  sender: Player;
  recipientUID: string;
}

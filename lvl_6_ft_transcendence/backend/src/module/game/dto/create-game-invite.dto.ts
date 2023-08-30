import { Player } from '../Player';

export interface CreateGameInviteDTO {
  recipientUID: string;
  sender: Player;
}

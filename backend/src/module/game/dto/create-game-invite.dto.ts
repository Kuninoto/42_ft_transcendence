import { Player } from '../Player';

export interface CreateGameInviteDTO {
  receiverUID: number;
  sender: Player;
}

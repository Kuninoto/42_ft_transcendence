import { UUID } from 'crypto';
import { GameInvite } from 'types';
import { CreateGameInviteDTO } from './dto/create-game-invite.dto';

export class GameInviteMap {
  /* As JS is a fuckfest maps with numbers as keys don't work
    because under the hood the keys are always strings,
    due to that, I'm forced to use the string type for Ids, which are numbers :) */
  private gameInviteMap: Map<string, GameInvite> = new Map<
    string,
    GameInvite
  >();

  public createGameInvite(createGameInviteDto: CreateGameInviteDTO): UUID {
    const inviteId: UUID = crypto.randomUUID();

    this.gameInviteMap.set(inviteId.toString(), {
      recipientUID: createGameInviteDto.recipientUID,
      sender: createGameInviteDto.sender,
    });

    return inviteId;
  }

  public deleteInviteByInviteId(inviteId: UUID): void {
    this.gameInviteMap.delete(inviteId.toString());
  }

  public deleteAllInvitesToUser(userId: number): void {
    this.gameInviteMap.forEach((value: GameInvite, key: string): void => {
      if (userId == value.recipientUID) this.gameInviteMap.delete(key);
    });
  }

  public findInviteById(inviteId: UUID): GameInvite | undefined {
    return this.gameInviteMap.get(inviteId.toString());
  }
}

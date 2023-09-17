import { nanoid } from 'nanoid';
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

  public createGameInvite(createGameInviteDto: CreateGameInviteDTO): string {
    const inviteId: string = nanoid();

    this.gameInviteMap.set(inviteId, {
      id: inviteId,
      receiverUID: createGameInviteDto.receiverUID,
      sender: createGameInviteDto.sender,
    });

    return inviteId;
  }

  public findInviteById(inviteId: string): GameInvite | undefined {
    return this.gameInviteMap.get(inviteId);
  }

  public findAllInvitesWithUser(userId: number): GameInvite[] {
    const invites: GameInvite[] = [];

    this.gameInviteMap.forEach((invite: GameInvite): void => {
      if (userId == invite.receiverUID || userId == invite.sender.userId)
        invites.push(invite);
    });

    return invites;
  }

  public deleteInviteByInviteId(inviteId: string): void {
    this.gameInviteMap.delete(inviteId);
  }
}

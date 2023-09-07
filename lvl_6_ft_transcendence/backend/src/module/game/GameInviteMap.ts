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
      recipientUID: createGameInviteDto.recipientUID,
      sender: createGameInviteDto.sender,
    });

    return inviteId;
  }

  public deleteInviteByInviteId(inviteId: string): void {
    this.gameInviteMap.delete(inviteId);
  }

  public deleteAllInvitesToUser(userId: number): void {
    this.gameInviteMap.forEach((value: GameInvite, key: string): void => {
      if (userId == value.recipientUID) this.gameInviteMap.delete(key);
    });
  }

  public findInviteById(inviteId: string): GameInvite | undefined {
    return this.gameInviteMap.get(inviteId);
  }
}

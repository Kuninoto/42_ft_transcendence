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
  private inviteIdCounter: number = 0;

  public createGameInvite(createGameInviteDto: CreateGameInviteDTO): number {
    this.gameInviteMap.set(this.inviteIdCounter.toString(), {
      sender: createGameInviteDto.sender,
      recipientUID: parseInt(createGameInviteDto.recipientUID),
    });
    return this.inviteIdCounter++;
  }

  public findInviteById(inviteId: string): GameInvite {
    return this.gameInviteMap.get(inviteId);
  }

  public deleteInviteByInviteId(inviteId: string): void {
    this.gameInviteMap.delete(inviteId);
  }
}

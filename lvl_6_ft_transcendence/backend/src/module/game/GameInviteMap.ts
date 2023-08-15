import { GameInvite } from "src/common/types/game-invite.interface";
import { CreateGameInviteDTO } from "./dto/create-game-invite.dto";

export class GameInviteMap {
  private gameInviteMap: Map<number, GameInvite> = new Map<number, GameInvite>();
  private inviteIdCounter: number = 0;

  public createGameInvite(createGameInviteDto: CreateGameInviteDTO): number {
    this.gameInviteMap.set(this.inviteIdCounter, createGameInviteDto);
    return this.inviteIdCounter++;
  }

  public findInviteById(inviteId: number): GameInvite {
    return this.gameInviteMap.get(inviteId);
  }

  public deleteInviteByInviteId(inviteId: number): void {
    this.gameInviteMap.delete(inviteId);
  }
}

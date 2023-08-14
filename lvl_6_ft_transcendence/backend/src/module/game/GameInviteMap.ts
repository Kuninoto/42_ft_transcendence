export class GameInviteMap {
  private gameInviteMap: Map<number, string> = new Map<number, string>();
  private inviteIdCounter: number = 0;

  public createNewInvite(roomId: string): number {
    this.gameInviteMap.set(this.inviteIdCounter, roomId);
    return this.inviteIdCounter++;
  }

  public deleteInviteByInviteId(inviteId: number): void {
    this.gameInviteMap.delete(inviteId);
  }
}

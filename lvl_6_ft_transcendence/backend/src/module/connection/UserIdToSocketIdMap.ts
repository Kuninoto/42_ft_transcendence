export class UserIdToSocketIdMap {
  // As JS is a fuckfest maps with numbers as keys don't work
  // because under the hood the keys are always strings :)
  private userIdToSocketIdMap: Map<string, string> = new Map<string, string>();

  public findSocketIdByUID(userId: string): string | undefined {
    return this.userIdToSocketIdMap.get(userId);
  }

  public updateSocketIdByUID(userId: string, socketId: string): void {
    this.userIdToSocketIdMap.set(userId, socketId);
  }

  public deleteSocketIdByUID(userId: string): void {
    this.userIdToSocketIdMap.delete(userId);
  }
}

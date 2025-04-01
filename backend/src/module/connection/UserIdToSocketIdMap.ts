export class UserIdToSocketIdMap {
  /* As JS is a fuckfest maps with numbers as keys don't work
  because under the hood the keys are always strings,
  due to that, I'm forced to use the string type for Ids, which are numbers :) */
  private userIdToSocketIdMap: Map<string, string> = new Map<string, string>();

  public findSocketIdByUID(userId: number): string | undefined {
    return this.userIdToSocketIdMap.get(userId.toString());
  }

  public updateSocketIdByUID(userId: number, socketId: string): void {
    this.userIdToSocketIdMap.set(userId.toString(), socketId);
  }
  public deleteSocketIdByUID(userId: number): void {
    this.userIdToSocketIdMap.delete(userId.toString());
  }
}

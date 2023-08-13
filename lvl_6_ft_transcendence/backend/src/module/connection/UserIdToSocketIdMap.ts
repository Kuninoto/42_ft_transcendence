export class UserIdToSocketIdMap {
  private userIdToSocketIdMap: Map<number, string> = new Map<number, string>();

  public findSocketIdByUID(userId: number): string | undefined {
    return this.userIdToSocketIdMap.get(userId);
  }

  public updateSocketIdByUID(userId: number, socketId: string): void {
    this.userIdToSocketIdMap.set(userId, socketId);
  }

  public deleteSocketIdByUID(userId: number): void {
    this.userIdToSocketIdMap.delete(userId);
  }
}

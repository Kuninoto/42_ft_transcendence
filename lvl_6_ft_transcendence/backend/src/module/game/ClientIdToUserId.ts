export class ClientIdToUserIdMap {
  private clientIdToUserId: Map<string, number> = new Map<string, number>();

  public addPair(newClientId: string, newUserId: number): void {
    this.clientIdToUserId.set(newClientId, newUserId);
  }

  public getUserIdFromClientId(clientId: string): number {
    return this.clientIdToUserId.get(clientId);
  }

  public isUserIdAlreadyRegistered(userId: number): boolean {
    for (const value of this.clientIdToUserId.values()) {
      if (value === userId) {
        return true;
      }
    }
    return false;
  }

  public removePlayerFromMap(clientID: string): void {
    this.clientIdToUserId.delete(clientID);
  }
}

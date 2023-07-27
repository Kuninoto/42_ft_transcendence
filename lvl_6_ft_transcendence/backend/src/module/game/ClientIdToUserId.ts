export class ClientIdToUserIdMap {
  private clientIdToUserId: Map<string, number> = new Map<string, number>();

  public addPair(newClientId: string, newUserId: number): void {
    this.clientIdToUserId.set(newClientId, newUserId);
  }

  public getUserIdFromClientId(clientId: string): number {
    return this.clientIdToUserId.get(clientId);
  }
}

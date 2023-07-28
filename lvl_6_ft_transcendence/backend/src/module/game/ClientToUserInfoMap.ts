import { Socket } from "socket.io";

export class ClientToUserInfoMap {
  private clientIdToUserId: Map<string, number> = new Map<string, number>();
  private clientIdToClient: Map<string, Socket> = new Map<string, Socket>();

  public registerNewClientInfo(newClient: Socket, newClientUID: number): void {
    this.clientIdToUserId.set(newClient.id, newClientUID);
    this.clientIdToClient.set(newClient.id, newClient);
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

  // Returns the removed userId
  public removePlayerFromMap(clientID: string): number | undefined {
    const userId: number | undefined = this.clientIdToUserId.get(clientID);
    this.clientIdToUserId.delete(clientID);
    return userId;
  }

  public getClientFromClientID(clientID: string): Socket | undefined {
    return this.clientIdToClient.get(clientID);
  }
}

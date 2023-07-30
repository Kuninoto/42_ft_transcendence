import { Socket } from 'socket.io';

export interface ClientInfo {
  userID: number,
  client: Socket,
}

export class ClientIdToClientInfoMap {
  private clientIdToUserInfo: Map<string, ClientInfo> = new Map<string, ClientInfo>();

  public registerNewClientInfo(clientInfo: ClientInfo): void {
    this.clientIdToUserInfo.set(clientInfo.client.id, clientInfo);
  }

  public getUserIdFromClientId(clientId: string): number | undefined {
    return this.clientIdToUserInfo.get(clientId)?.userID;
  }

  public isUserIdAlreadyRegistered(userId: number): boolean {
    for (const client of this.clientIdToUserInfo.values()) {
      if (client.userID === userId) {
        return true;
      }
    }
    return false;
  }

  // Returns the removed userId
  public removePlayerFromMap(clientID: string): number | undefined {
    const userID: number | undefined = this.clientIdToUserInfo.get(clientID)?.userID;
    this.clientIdToUserInfo.delete(clientID);
    return userID;
  }

  public getClientFromClientID(clientID: string): Socket | undefined {
    return this.clientIdToUserInfo.get(clientID)?.client;
  }
}

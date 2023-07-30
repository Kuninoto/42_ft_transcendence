import { Socket } from 'socket.io';
import { Player } from './game-data';

export class ClientIdToPlayerInfoMap {
  private clientIdToPlayerInfo: Map<string, Player> = new Map<string, Player>();

  public registerNewPlayer(newPlayer: Player): void {
    this.clientIdToPlayerInfo.set(newPlayer.client.id, newPlayer);
  }

  public getUserIdFromClientId(clientId: string): number | undefined {
    return this.clientIdToPlayerInfo.get(clientId)?.userId;
  }

  public isUserIdAlreadyRegistered(userId: number): boolean {
    for (const player of this.clientIdToPlayerInfo.values()) {
      if (player.userId === userId) {
        return true;
      }
    }
    return false;
  }

  // Returns the removed userId
  public removePlayerFromMap(clientID: string): number | undefined {
    const userID: number | undefined =
      this.clientIdToPlayerInfo.get(clientID)?.userId;
    this.clientIdToPlayerInfo.delete(clientID);
    return userID;
  }

  public getClientFromClientID(clientID: string): Socket | undefined {
    return this.clientIdToPlayerInfo.get(clientID)?.client;
  }
}

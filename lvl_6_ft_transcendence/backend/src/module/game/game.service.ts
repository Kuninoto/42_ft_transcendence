import { Injectable } from '@nestjs/common';
import { ClientIdToUserIdMap } from './ClientIdToUserId';
import { GameQueue } from './GameQueue';

@Injectable()
export class GameService {
  constructor(
    private gameQueue: GameQueue,
    private clientIdToUserIdMap: ClientIdToUserIdMap,
  ) {}

  public queueToLadder(newClientId: string, newUserId: number): void {
    if (this.clientIdToUserIdMap.isUserIdAlreadyRegistered(newUserId)) {
      throw new Error('Client is already connected');
    }
    this.clientIdToUserIdMap.addPair(newClientId, newUserId);

    this.gameQueue.enqueue(newClientId);
    console.log('gameQueue now has ' + this.gameQueue.size() + ' elements!');
  }

  public leaveLadderQueue(clientID: string): void {
    this.gameQueue.removePlayerFromQueue(clientID);
    this.clientIdToUserIdMap.removePlayerFromMap(clientID);
    console.log('gameQueue now has ' + this.gameQueue.size() + ' elements!');
  }

  public dequeueTwoPlayers(): { player1ID: string; player2ID: string } {
    const player1ID: string = this.gameQueue.dequeue();
    const player2ID: string = this.gameQueue.dequeue();

    console.log('queue size = ' + this.gameQueue.size());

    return { player1ID, player2ID };
  }

  public areTwoPlayersWaiting(): boolean {
    return this.gameQueue.size() >= 2;
  }

  public addClientIdUserIdPair(newClientId: string, newUserId: number): void {
    if (this.clientIdToUserIdMap.isUserIdAlreadyRegistered(newUserId)) {
      throw new Error();
    }
    console.log('newClientId = ' + newClientId);
    console.log('newUserId = ' + newUserId);

    this.clientIdToUserIdMap.addPair(newClientId, newUserId);
  }

  public getUserIdFromClientId(clientId: string): number {
    return this.clientIdToUserIdMap.getUserIdFromClientId(clientId);
  }
}

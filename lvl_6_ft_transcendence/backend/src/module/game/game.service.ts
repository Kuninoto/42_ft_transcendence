import { Injectable } from '@nestjs/common';
import { ClientIdToUserIdMap } from './ClientIdToUserId';
import { GameQueue } from './GameQueue';
import { UsersService } from '../users/users.service';
import { UserStatus } from 'src/common/types/user-status.enum';

@Injectable()
export class GameService {
  constructor(
    private gameQueue: GameQueue,
    private clientIdToUserIdMap: ClientIdToUserIdMap,
    private usersService: UsersService,
  ) {}

  public queueToLadder(newClientId: string, newUserId: number): void {
    if (this.clientIdToUserIdMap.isUserIdAlreadyRegistered(newUserId)) {
      throw new Error('Client is already connected');
    }

    this.clientIdToUserIdMap.addPair(newClientId, newUserId);
    this.gameQueue.enqueue(newClientId);

    this.usersService.updateUserStatusByUID(newUserId, UserStatus.IN_QUEUE);

    console.log('gameQueue now has ' + this.gameQueue.size() + ' elements!');
  }

  public leaveLadderQueue(clientID: string): void {
    this.gameQueue.removePlayerFromQueue(clientID);
    const userId: number | undefined = this.clientIdToUserIdMap.removePlayerFromMap(clientID);

    if (userId)
      this.usersService.updateUserStatusByUID(userId, UserStatus.ONLINE);

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

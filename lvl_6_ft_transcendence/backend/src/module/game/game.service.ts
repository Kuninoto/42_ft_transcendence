import { Injectable } from '@nestjs/common';
import { ClientToUserInfoMap } from './ClientToUserInfoMap';
import { GameQueue } from './GameQueue';
import { UsersService } from '../users/users.service';
import { UserStatus } from 'src/common/types/user-status.enum';
import { Server, Socket } from 'socket.io';
import {
  GameQueueDataDTO,
  PlayerSide,
  QueueMessage,
} from './dto/game-queue-data.interface';

@Injectable()
export class GameService {
  constructor(
    private gameQueue: GameQueue,
    private clientToUserInfoMap: ClientToUserInfoMap,
    private usersService: UsersService,
  ) {}

  public registerNewClientInfo(newClient: Socket, newClientUID: number): void {
    if (this.clientToUserInfoMap.isUserIdAlreadyRegistered(newClientUID)) {
      throw new Error('Client is already connected');
    }
    this.clientToUserInfoMap.registerNewClientInfo(newClient, newClientUID);
  }

  public queueToLadder(
    playerRooms: Socket[],
    server: Server,
    newClient: Socket,
    newClientUId: number,
  ): void {
    this.gameQueue.enqueue(newClient.id);
    this.usersService.updateUserStatusByUID(newClientUId, UserStatus.IN_QUEUE);

    // If there's no other player waiting, keep him waiting
    if (this.gameQueue.size() === 1) {
      const queueData: GameQueueDataDTO = {
        side: PlayerSide.LEFT,
        message: QueueMessage.WAITING_FOR_OPPONENT,
      };

      newClient.emit('waiting-for-opponent', queueData);
    } else {
      const queueData: GameQueueDataDTO = {
        side: PlayerSide.RIGHT,
        message: QueueMessage.OPPONENT_FOUND,
      };

      const playerOneClientId: string = this.gameQueue.dequeue();
      const playerTwoClientId: string = this.gameQueue.dequeue();

      const playerOne: Socket =
        this.clientToUserInfoMap.getClientFromClientID(playerOneClientId);
      const playerTwo: Socket =
        this.clientToUserInfoMap.getClientFromClientID(playerTwoClientId);

      this.joinPlayersToRoom(server, playerOne, playerTwo);
    }

    console.log('gameQueue now has ' + this.gameQueue.size() + ' elements!');
  }

  public leaveLadderQueue(clientID: string): void {
    this.gameQueue.removePlayerFromQueue(clientID);
    const userId: number | undefined =
      this.clientToUserInfoMap.removePlayerFromMap(clientID);

    if (userId)
      this.usersService.updateUserStatusByUID(userId, UserStatus.ONLINE);

    console.log('gameQueue now has ' + this.gameQueue.size() + ' elements!');
  }

  private joinPlayersToRoom(
    server: Server,
    playerOne: Socket,
    playerTwo: Socket,
  ): void {
    const roomName: string = playerOne.id + ' vs. ' + playerTwo.id;

    // Join both players to the same room
    playerOne.join(roomName);
    playerTwo.join(roomName);

    // Assign opponentUID's respectively
    playerOne.data.opponentUID = this.clientToUserInfoMap.getUserIdFromClientId(
      playerTwo.id,
    );
    playerTwo.data.opponentUID = this.clientToUserInfoMap.getUserIdFromClientId(
      playerOne.id,
    );

    // emit to both players their respective opponent id
    // server.emit() ?
  }
}

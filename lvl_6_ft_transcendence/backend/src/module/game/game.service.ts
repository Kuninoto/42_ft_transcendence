import { Injectable } from '@nestjs/common';
import { ClientIdToClientInfoMap, ClientInfo } from './ClientIdToClientInfoMap';
import { GameQueue } from './GameQueue';
import { UsersService } from '../users/users.service';
import { UserStatus } from 'src/common/types/user-status.enum';
import { Server, Socket } from 'socket.io';
import {
  GameQueueDataDTO,
  PlayerSide,
  QueueMessage,
} from './dto/game-queue-data.interface';
import { UserSearchInfo } from 'src/common/types/user-search-info.interface';

@Injectable()
export class GameService {
  constructor(
    private gameQueue: GameQueue,
    private clientIdToClientInfo: ClientIdToClientInfoMap,
    private usersService: UsersService,
  ) {}

  public registerNewClientInfo(newClient: Socket, newClientUID: number): void {
    //! TODO
    // Uncomment this check, just for testing purposes

    //if (this.clientIdToClientInfo.isUserIdAlreadyRegistered(newClientUID)) {
    //  throw new Error('Client is already connected');
    //}

    this.clientIdToClientInfo.registerNewClientInfo({
      client: newClient,
      userID: newClientUID,
    });
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
      newClient.data.side = PlayerSide.LEFT;
    } else {
      newClient.data.side = PlayerSide.RIGHT;

      const playerOneClientId: string = this.gameQueue.dequeue();
      const playerTwoClientId: string = this.gameQueue.dequeue();

      const playerOne: Socket =
        this.clientIdToClientInfo.getClientFromClientID(playerOneClientId);
      const playerTwo: Socket =
        this.clientIdToClientInfo.getClientFromClientID(playerTwoClientId);

      this.joinPlayersToRoom(server, playerOne, playerTwo);
    }

    console.log('gameQueue now has ' + this.gameQueue.size() + ' elements!');
  }

  public leaveLadderQueue(clientID: string): void {
    this.gameQueue.removePlayerFromQueue(clientID);
    const userId: number | undefined =
      this.clientIdToClientInfo.removePlayerFromMap(clientID);

    if (userId)
      this.usersService.updateUserStatusByUID(userId, UserStatus.ONLINE);

    console.log('gameQueue now has ' + this.gameQueue.size() + ' elements!');
  }

  private async joinPlayersToRoom(
    server: Server,
    playerOne: Socket,
    playerTwo: Socket,
  ): Promise<void> {
    const roomId: string = playerOne.id + 'vs.' + playerTwo.id;

    // Join both players to the same room
    playerOne.join(roomId);
    playerTwo.join(roomId);

    // Get the opponentUID of each player
    const playerOneOpponentUID =
      this.clientIdToClientInfo.getUserIdFromClientId(playerTwo.id);
    const playerTwoOpponentUID =
      this.clientIdToClientInfo.getUserIdFromClientId(playerOne.id);

    const playerOneOpponentInfo: UserSearchInfo =
      await this.usersService.findUserSearchInfoByUID(playerTwoOpponentUID);
    const playerTwoOpponentInfo: UserSearchInfo =
      await this.usersService.findUserSearchInfoByUID(playerOneOpponentUID);

    // Emit to both players their respective sides && opponent's info
    playerOne.emit('opponent-found', { roomId: roomId, side: playerOne.data.side, playerOneOpponentInfo });
    playerTwo.emit('opponent-found', { roomId: roomId, side: playerTwo.data.side, playerTwoOpponentInfo });

    // server.to(roomId).emit('game-data', GameData);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { GameRoom } from 'src/typeorm';
import { GameQueue } from './GameQueue';
import { ClientIdToClientInfoMap } from './ClientIdToClientInfoMap';
import { UsersService } from '../users/users.service';
import { UserStatus } from 'src/common/types/user-status.enum';
import { Server, Socket } from 'socket.io';
import { UserSearchInfo } from 'src/common/types/user-search-info.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateGameDTO } from './dto/create-game.dto';
import { GameType } from 'src/common/types/game-type.enum';
import { GamePlayer } from 'src/common/types/game-player.enum';
import { PlayerSide } from 'src/common/types/player-side.enum';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(GameRoom)
    private readonly gameRoomRepository: Repository<GameRoom>,
    private gameQueue: GameQueue,
    private clientIdToClientInfo: ClientIdToClientInfoMap,
    private usersService: UsersService,
  ) {}

  private readonly logger: Logger = new Logger(GameService.name);

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
    server: Server,
    newClient: Socket,
    newClientUId: number,
  ): void {
    this.gameQueue.enqueue(newClient.id);
    this.usersService.updateUserStatusByUID(newClientUId, UserStatus.IN_QUEUE);

    // If there's no other player waiting, keep him waiting
    if (this.gameQueue.size() === 1) {
      newClient.data.side = PlayerSide.LEFT;
      newClient.data.whichPlayerAmI = GamePlayer.PLAYER_ONE;
    } else {
      newClient.data.side = PlayerSide.RIGHT;
      newClient.data.whichPlayerAmI = GamePlayer.PLAYER_TWO;

      const playerOneClientId: string = this.gameQueue.dequeue();
      const playerTwoClientId: string = this.gameQueue.dequeue();

      const playerOne: Socket =
        this.clientIdToClientInfo.getClientFromClientID(playerOneClientId);
      const playerTwo: Socket =
        this.clientIdToClientInfo.getClientFromClientID(playerTwoClientId);

      this.joinPlayersToRoom(server, playerOne, playerTwo);
    }
  }

  public leaveLadderQueue(clientID: string): void {
    this.gameQueue.removePlayerFromQueue(clientID);
    const userId: number | undefined =
      this.clientIdToClientInfo.removePlayerFromMap(clientID);

    if (userId)
      this.usersService.updateUserStatusByUID(userId, UserStatus.ONLINE);
  }

  public async playerOneScored(gameRoomId: string): Promise<void> {
    await this.gameRoomRepository.increment(
      { room_id: gameRoomId },
      'player_one_score',
      1,
    );
  }

  public async playerTwoScored(gameRoomId: string): Promise<void> {
    await this.gameRoomRepository.increment(
      { room_id: gameRoomId },
      'player_two_score',
      1,
    );
  }

  private async joinPlayersToRoom(
    server: Server,
    playerOne: Socket,
    playerTwo: Socket,
  ): Promise<void> {
    const roomId: string = crypto.randomUUID();

    // Join both players to the same room
    playerOne.join(roomId);
    playerTwo.join(roomId);

    this.createGame({ room_id: roomId, game_type: GameType.LADDER });
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
    playerOne.emit('opponent-found', {
      roomId: roomId,
      side: playerOne.data.side,
      opponentInfo: playerOneOpponentInfo,
    });

    playerTwo.emit('opponent-found', {
      roomId: roomId,
      side: playerTwo.data.side,
      opponentInfo: playerTwoOpponentInfo,
    });

    // server.to(roomId).emit('game-data', GameData);
  }

  private async createGame(createGameDTO: CreateGameDTO): Promise<void> {
    const newGame = this.gameRoomRepository.create(createGameDTO);
    await this.gameRoomRepository.save(newGame);
  }
}

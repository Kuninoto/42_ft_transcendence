import { Injectable, Logger } from '@nestjs/common';
import { GameRoom } from 'src/typeorm';
import { GameQueue } from './GameQueue';
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
import { Player } from './game-data';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(GameRoom)
    private readonly gameRoomRepository: Repository<GameRoom>,
    private gameQueue: GameQueue,
    private usersService: UsersService,
  ) {}

  private readonly logger: Logger = new Logger(GameService.name);

  public queueToLadder(server: Server, player: Player): void {
    this.gameQueue.enqueue(player);
    this.usersService.updateUserStatusByUID(player.userId, UserStatus.IN_QUEUE);

    // If there's no other player waiting, keep him waiting
    if (this.gameQueue.size() === 1) {
      player.client.data.side = PlayerSide.LEFT;
      player.client.data.whichPlayerAmI = GamePlayer.PLAYER_ONE;
    } else {
      player.client.data.side = PlayerSide.RIGHT;
      player.client.data.whichPlayerAmI = GamePlayer.PLAYER_TWO;

      const playerOne: Player = this.gameQueue.dequeue();
      const playerTwo: Player = this.gameQueue.dequeue();

      this.joinPlayersToRoom(server, playerOne, playerTwo);
    }
  }

  public leaveLadderQueue(clientId: string): void {
    const removedPlayer: Player | void =
      this.gameQueue.removePlayerFromQueueByClientId(clientId);

    if (removedPlayer)
      this.usersService.updateUserStatusByUID(
        removedPlayer.userId,
        UserStatus.ONLINE,
      );
  }

  public async leftPlayerScored(gameRoomId: string): Promise<void> {
    await this.gameRoomRepository.increment(
      { room_id: gameRoomId },
      'left_player_score',
      1,
    );
  }

  public async rightPlayerScored(gameRoomId: string): Promise<void> {
    await this.gameRoomRepository.increment(
      { room_id: gameRoomId },
      'right_player_score',
      1,
    );
  }

  private async joinPlayersToRoom(
    server: Server,
    playerOne: Player,
    playerTwo: Player,
  ): Promise<void> {
    const roomId: string = crypto.randomUUID();

    // Join both players to the same room
    playerOne.client.join(roomId);
    playerTwo.client.join(roomId);

    this.createGame({ room_id: roomId, game_type: GameType.LADDER });

    const playerOneUserSearchInfo: UserSearchInfo =
      await this.usersService.findUserSearchInfoByUID(playerOne.userId);

    const playerTwoUserSearchInfo: UserSearchInfo =
      await this.usersService.findUserSearchInfoByUID(playerTwo.userId);

    // Emit to both players their respective sides && opponent's info
    playerOne.client.emit('opponent-found', {
      roomId: roomId,
      side: playerOne.client.data.side,
      opponentInfo: playerTwoUserSearchInfo,
    });

    playerTwo.client.emit('opponent-found', {
      roomId: roomId,
      side: playerTwo.client.data.side,
      opponentInfo: playerOneUserSearchInfo,
    });

    // server.to(roomId).emit('game-data', GameData);
  }

  private async createGame(createGameDTO: CreateGameDTO): Promise<void> {
    const newGame = this.gameRoomRepository.create(createGameDTO);
    await this.gameRoomRepository.save(newGame);
  }
}

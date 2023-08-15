import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameType } from 'src/common/types/game-type.enum';
import { PlayerSide } from 'src/common/types/player-side.enum';
import { UserSearchInfo } from 'src/common/types/user-search-info.interface';
import { UserStatus } from 'src/common/types/user-status.enum';
import { GameResult } from 'src/entity/game-result.entity';
import { User } from 'src/typeorm/index';
import { Repository } from 'typeorm';
import { ConnectionGateway } from '../connection/connection.gateway';
import { UserStatsService } from '../user-stats/user-stats.service';
import { UsersService } from '../users/users.service';
import { Ball } from './Ball';
import { GameQueue } from './GameQueue';
import { GameRoom } from './GameRoom';
import { GameRoomMap } from './GameRoomMap';
import { Player } from './Player';
import { GameEngineService } from './game-engine.service';
import { GameGateway } from './game.gateway';
import { OpponentFoundDTO } from './dto/opponent-found.dto';
import { GameInviteMap } from './GameInviteMap';
import { Socket } from 'socket.io';
import { CreateGameInviteDTO } from './dto/create-game-invite.dto';
import { GameInvite } from 'src/common/types/game-invite.interface';
import { OpponentInfo } from 'src/common/types/opponent-info.interface';

const GAME_START_TIMEOUT: number = 1000 * 3;

@Injectable()
export class GameService {
  constructor(
    private gameQueue: GameQueue,
    private GameRoomMap: GameRoomMap,
    private gameInviteMap: GameInviteMap,
    private readonly gameEngine: GameEngineService,
    @Inject(forwardRef(() => GameGateway))
    private readonly gameGateway: GameGateway,
    @InjectRepository(GameResult)
    private readonly gameResultRepository: Repository<GameResult>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly userStatsService: UserStatsService,
    @Inject(forwardRef(() => ConnectionGateway))
    private readonly connectionGateway: ConnectionGateway,
  ) {}

  private readonly logger: Logger = new Logger(GameService.name);

  public isPlayerInQueueOrGame(playerUID: number): boolean {
    return (
      this.gameQueue.isPlayerInQueue(playerUID) ||
      this.GameRoomMap.isPlayerInGame(playerUID)
    );
  }

  public async queueToLadder(player: Player): Promise<void> {
    this.gameQueue.enqueue(player);
    await this.connectionGateway.updateUserStatus(
      player.userId,
      UserStatus.IN_QUEUE,
    );

    // If there's no more players on the queue, assign the left side and keep him waiting
    if (this.gameQueue.size() === 1) {
      player.setPlayerSide(PlayerSide.LEFT);
    } else {
      player.setPlayerSide(PlayerSide.RIGHT);

      const playerOne: Player = this.gameQueue.dequeue();
      const playerTwo: Player = this.gameQueue.dequeue();

      this.joinPlayersToRoom(playerOne, playerTwo);
    }
  }

  public createGameInvite(createGameInviteDto: CreateGameInviteDTO): number {
    return this.gameInviteMap.createGameInvite(createGameInviteDto);
  }

  public findGameInviteByInviteId(inviteId: number): GameInvite | undefined {
    return this.gameInviteMap.findInviteById(inviteId);
  }

  /**
   * Disconnects a player from the game mechanism.
   *
   * If he was on the queue, leaves;
   * If he was an on an on-going game, the remaining player wins.
   * If he wasn't in neither of the above, does nothing.
   * @param playerUserId userId of the disconnecting player
   */
  public async disconnectPlayer(playerUserId: number): Promise<void> {
    const playerRoom: GameRoom | null =
      this.GameRoomMap.findRoomWithPlayerByUID(playerUserId);

    /* If a room with the disconnecting player is found
    it's because he was on an on-going game.
    Upon game end we delete the gameRoom from the GameRoomMap */
    if (playerRoom) {
      // If the left player's client id === disconnecting player's userId
      // Right player winned
      // else Left player winned
      const winnerSide: PlayerSide =
        playerRoom.leftPlayer.userId === playerUserId
          ? PlayerSide.RIGHT
          : PlayerSide.LEFT;

      await this.gameEngine.endGameDueToDisconnection(playerRoom, winnerSide);
    } else {
      // Remove player from queue if he was there
      this.gameQueue.removePlayerFromQueueByUID(playerUserId);
    }
  }

  public async gameInviteAccepted(
    inviteId: number,
    recipient: Socket,
  ): Promise<OpponentInfo> {
    const gameInvite: GameInvite = this.gameInviteMap.findInviteById(inviteId);

    const recipientInfo: OpponentInfo =
      await this.usersService.findOpponentInfoByUID(gameInvite.senderUID);
    this.connectionGateway.server
      .to(gameInvite.roomId)
      .emit('inviteAccepted', recipientInfo);

    recipient.join(gameInvite.roomId);

    const senderInfo: OpponentInfo =
      await this.usersService.findOpponentInfoByUID(gameInvite.senderUID);

    this.gameInviteMap.deleteInviteByInviteId(inviteId);
    // refer to:
    // https://stackoverflow.com/questions/49612658/socket-io-acknowledgement-in-nest-js
    return senderInfo;
  }

  public gameInviteDeclined(inviteId: number) {
    const gameInvite: GameInvite = this.gameInviteMap.findInviteById(inviteId);

    this.connectionGateway.server.to(gameInvite.roomId).emit('inviteDeclined');
    this.gameInviteMap.deleteInviteByInviteId(inviteId);
  }

  public async playerReady(gameRoomId: string, clientId: string) {
    let gameRoom: GameRoom | undefined =
      this.GameRoomMap.findGameRoomById(gameRoomId);
    if (!gameRoom) {
      return;
    }

    const playerToUpdate: Player =
      gameRoom.leftPlayer.client.id === clientId
        ? gameRoom.leftPlayer
        : gameRoom.rightPlayer;

    const updatedGameRoom: Partial<GameRoom> = {
      // Access object thru dynamic object key
      [playerToUpdate === gameRoom.leftPlayer ? 'leftPlayer' : 'rightPlayer']: {
        ...playerToUpdate,
        isReady: true,
      },
    };

    this.GameRoomMap.updateGameRoomById(gameRoomId, updatedGameRoom);
    // Fetch the updated info from GameRoomMap
    gameRoom = this.GameRoomMap.findGameRoomById(gameRoomId);

    if (gameRoom.leftPlayer.isReady && gameRoom.rightPlayer.isReady) {
      await this.connectionGateway.updateUserStatus(
        gameRoom.rightPlayer.userId,
        UserStatus.IN_GAME,
      );
      await this.connectionGateway.updateUserStatus(
        gameRoom.leftPlayer.userId,
        UserStatus.IN_GAME,
      );

      setTimeout(() => {
        this.gameEngine.startGame(gameRoomId);
      }, GAME_START_TIMEOUT);
    }
  }

  public paddleMove(gameRoomId: string, clientId: string, newY: number): void {
    const gameRoom: GameRoom | undefined =
      this.GameRoomMap.findGameRoomById(gameRoomId);
    if (!gameRoom) {
      return;
    }

    const playerToUpdate: Player =
      gameRoom.leftPlayer.client.id === clientId
        ? gameRoom.leftPlayer
        : gameRoom.rightPlayer;

    const updatedGameRoom: Partial<GameRoom> = {
      // Access object thru dynamic object key
      [playerToUpdate === gameRoom.leftPlayer ? 'leftPlayer' : 'rightPlayer']: {
        ...playerToUpdate,
        paddleY: newY,
      },
    };

    this.GameRoomMap.updateGameRoomById(gameRoomId, updatedGameRoom);
  }

  public async findGameResultsWhereUserPlayed(
    userId: number,
  ): Promise<GameResult[]> {
    const gameResults: GameResult[] = await this.gameResultRepository.find({
      where: [{ winner: { id: userId } }, { loser: { id: userId } }],
      relations: { winner: true, loser: true },
    });
    return gameResults;
  }

  public async gameEnded(
    gameType: GameType,
    roomId: string,
    winner: Player,
    loser: Player,
    wonByDisconnection: boolean,
  ): Promise<void> {
    this.gameGateway.broadcastGameEnd(roomId, winner, loser);
    this.GameRoomMap.deleteGameRoomByRoomId(roomId);

    await this.saveGameResult(gameType, winner, loser);

    await this.connectionGateway.updateUserStatus(
      winner.userId,
      UserStatus.ONLINE,
    );
    await this.connectionGateway.updateUserStatus(
      loser.userId,
      UserStatus.ONLINE,
    );

    await this.userStatsService.updateUserStatsUponGameEnd(
      winner.userId,
      loser.userId,
      wonByDisconnection,
    );
  }

  public async joinPlayersToRoom(
    playerOne: Player,
    playerTwo: Player,
  ): Promise<void> {
    const roomId: string = crypto.randomUUID();

    // Join both players to the same room
    playerOne.client.join(roomId);
    playerTwo.client.join(roomId);

    // Determine the left and right players based on their 'side' property
    // assigned earlier based on who first entered the queue
    const { leftPlayer, rightPlayer } =
      playerOne.side === PlayerSide.LEFT
        ? { leftPlayer: playerOne, rightPlayer: playerTwo }
        : { leftPlayer: playerTwo, rightPlayer: playerOne };

    this.GameRoomMap.createNewGameRoom({
      roomId: roomId,
      gameType: GameType.LADDER,
      ball: new Ball(),
      leftPlayer: leftPlayer,
      rightPlayer: rightPlayer,
    });

    // Emit 'opponentFound' event to both players
    await this.emitOpponentFoundEvent(playerOne, roomId, playerTwo.userId);
    await this.emitOpponentFoundEvent(playerTwo, roomId, playerOne.userId);
  }

  private async emitOpponentFoundEvent(
    player: Player,
    roomId: string,
    opponentUID: number,
  ): Promise<void> {
    const opponentInfo: OpponentInfo =
      await this.usersService.findOpponentInfoByUID(opponentUID);

    const opponentFound: OpponentFoundDTO = {
      roomId: roomId,
      side: player.side,
      opponentInfo: opponentInfo,
    };
    player.client.emit('opponentFound', opponentFound);
  }

  private async saveGameResult(
    gameType: GameType,
    winner: Player,
    loser: Player,
  ): Promise<void> {
    const winnerUser: User = await this.usersService.findUserByUID(
      winner.userId,
    );
    const loserUser: User = await this.usersService.findUserByUID(loser.userId);

    const newGameResult: GameResult = this.gameResultRepository.create({
      game_type: gameType,
      winner: winnerUser,
      winner_score: winner.score,
      loser: loserUser,
      loser_score: loser.score,
    });
    await this.gameResultRepository.save(newGameResult);
  }
}

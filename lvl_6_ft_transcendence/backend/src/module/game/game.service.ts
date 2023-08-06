import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { GameQueue } from './GameQueue';
import { GameRoomsMap } from './GameRoomsMap';
import { UsersService } from '../users/users.service';
import { UserStatus } from 'src/common/types/user-status.enum';
import { GameType } from 'src/common/types/game-type.enum';
import { PlayerSide } from 'src/common/types/player-side.enum';
import { Ball } from './Ball';
import { Player } from './Player';
import { GameRoom } from './GameRoom';
import { GameGateway } from './game.gateway';
import { User, UserStats } from 'src/entity/index';
import { GameResult } from 'src/entity/game-result.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStatsForLeaderboard } from 'src/common/types/user-stats-for-leaderboard.interface';
import { UserSearchInfo } from 'src/common/types/user-search-info.interface';
import { GAME_START_TIMEOUT, GameEngineService } from './game-engine.service';

@Injectable()
export class GameService {
  constructor(
    private readonly gameQueue: GameQueue,
    private readonly gameRoomsMap: GameRoomsMap,
    private readonly gameEngine: GameEngineService,
    @Inject(forwardRef(() => GameGateway))
    private readonly gameGateway: GameGateway,
    @InjectRepository(GameResult)
    private readonly gameResultRepository: Repository<GameResult>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @InjectRepository(UserStats)
    private readonly userStatsRepository: Repository<UserStats>,
  ) {}

  private readonly logger: Logger = new Logger(GameService.name);

  public isPlayerInQueueOrGame(playerUID: number): boolean {
    return (
      this.gameQueue.isPlayerInQueue(playerUID) ||
      this.gameRoomsMap.isPlayerInGame(playerUID)
    );
  }

  public queueToLadder(player: Player): void {
    this.gameQueue.enqueue(player);
    this.usersService.updateUserStatusByUID(player.userId, UserStatus.IN_QUEUE);

    // If there's no other player waiting, assign the left side and keep him waiting
    if (this.gameQueue.size() === 1) {
      player.setPlayerSide(PlayerSide.LEFT);
    } else {
      player.setPlayerSide(PlayerSide.RIGHT);

      const playerOne: Player = this.gameQueue.dequeue();
      const playerTwo: Player = this.gameQueue.dequeue();

      this.joinPlayersToRoom(playerOne, playerTwo);
    }
  }

  public async disconnectPlayer(playerClientId: string): Promise<void> {
    const playerRoom: GameRoom | null =
      this.gameRoomsMap.findRoomWithPlayerByClientId(playerClientId);

    if (playerRoom) {
      // if the left player's client id === disconnected player's client Id
      // right player winned
      const winnerSide: PlayerSide =
        playerRoom.leftPlayer.client.id === playerClientId
          ? PlayerSide.RIGHT
          : PlayerSide.LEFT;

      await this.gameEngine.endGameDueToDisconnection(playerRoom, winnerSide);
    } else {
      // If player is connected to the socket
      // and isn't on a gameRoom he can only be in queue
      const leavingPlayer: Player =
        this.gameQueue.removePlayerFromQueueByClientId(playerClientId);

      await this.usersService.updateUserStatusByUID(
        leavingPlayer.userId,
        UserStatus.ONLINE,
      );
    }
  }

  public paddleMove(gameRoomId: string, clientId: string, newY: number): void {
    const gameRoom: GameRoom | undefined =
      this.gameRoomsMap.findGameRoomById(gameRoomId);
    if (!gameRoom) {
      return;
    }

    const playerToUpdate: Player =
      gameRoom.leftPlayer.client.id === clientId
        ? gameRoom.leftPlayer
        : gameRoom.rightPlayer;

    const updatedGameRoom: Partial<GameRoom> = {
      // access object thru dynamic object key
      [playerToUpdate === gameRoom.leftPlayer ? 'leftPlayer' : 'rightPlayer']: {
        ...playerToUpdate,
        paddleY: newY,
      },
    };

    this.gameRoomsMap.updateGameRoomById(gameRoomId, updatedGameRoom);
  }

  public getGameRoomInfo(gameRoomId: string): GameRoom | undefined {
    return this.gameRoomsMap.findGameRoomById(gameRoomId);
  }

  public async getLeaderboard(): Promise<UserStatsForLeaderboard[]> {
    // Get user ids, names, wins and win_rates
    // and sort them by wins and win_rates in descending order
    // if the number of wins of two players are equal
    // the one with the bigger win rate is placed above
    const leaderboardData: {
      wins: number;
      uid: number;
      name: string;
      win_rate: number;
    }[] = await this.userStatsRepository
      .createQueryBuilder('userStats')
      .select('user.id', 'uid')
      .addSelect('user.name', 'name')
      .addSelect('userStats.wins', 'wins')
      .addSelect('win_rate')
      .leftJoin('userStats.user', 'user')
      .orderBy('userStats.wins', 'DESC')
      .addOrderBy('win_rate', 'DESC')
      .getRawMany();

    return leaderboardData.map((leaderboardRow) => ({
      uid: leaderboardRow.uid,
      name: leaderboardRow.name,
      wins: leaderboardRow.wins,
      win_rate: leaderboardRow.win_rate,
    }));
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

  private async joinPlayersToRoom(
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

    this.gameRoomsMap.createNewGameRoom({
      roomId: roomId,
      gameType: GameType.LADDER,
      ball: new Ball(),
      leftPlayer: leftPlayer,
      rightPlayer: rightPlayer,
    });

    // Emit 'opponent-found' event to both players
    await this.emitOpponentFoundEvent(playerOne, roomId, playerTwo.userId);
    await this.emitOpponentFoundEvent(playerTwo, roomId, playerOne.userId);

    // !TODO
    // Switch the game start to when both players sent the 'player-ready' message ???

    setTimeout(() => {
      this.gameEngine.startGame(roomId);
    }, GAME_START_TIMEOUT);
  }

  private async emitOpponentFoundEvent(
    player: Player,
    roomId: string,
    opponentUID: number,
  ): Promise<void> {
    const opponentInfo: UserSearchInfo =
      await this.usersService.findUserSearchInfoByUID(
        player.userId,
        opponentUID,
      );
    player.client.emit('opponent-found', {
      roomId: roomId,
      side: player.side,
      opponentInfo: opponentInfo,
    });
  }

  public async gameEnded(
    roomId: string,
    winner: Player,
    loser: Player,
  ): Promise<void> {
    this.gameGateway.broadcastGameEnd(roomId, winner, loser);
    this.gameRoomsMap.deleteGameRoomByRoomId(roomId);

    // !TODO
    // Remove the hard coded Game Type
    await this.saveGameResult(GameType.LADDER, winner, loser);
    await this.usersService.updatePlayersStatsByUIDs(
      winner.userId,
      loser.userId,
    );
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

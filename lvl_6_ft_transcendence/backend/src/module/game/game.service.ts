import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { GameQueue } from './GameQueue';
import { GameRoomsMap } from './GameRoomsMap';
import { UsersService } from '../users/users.service';
import { UserStatus } from 'src/common/types/user-status.enum';
import { Server } from 'socket.io';
import { GameType } from 'src/common/types/game-type.enum';
import { PlayerSide } from 'src/common/types/player-side.enum';
import { Ball } from './Ball';
import { Player } from './Player';
import {
  GameRoom,
  CANVAS_HEIGHT,
  CANVAS_HEIGHT_OFFSET,
  MAX_SCORE,
} from './GameRoom';
import { PlayerIds } from 'src/common/types/player-interface.interface';
import { GameEndDTO } from './dto/game-end.dto';
import { GameGateway } from './game.gateway';
import { User, UserStats } from 'src/entity/index';
import { GameResult } from 'src/entity/game-result.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStatsForLeaderboard } from 'src/common/types/user-stats-for-leaderboard.interface';

@Injectable()
export class GameService {
  private playersInQueueOrGame: PlayerIds[];

  constructor(
    private readonly gameQueue: GameQueue,
    private readonly gameRoomsMap: GameRoomsMap,
    @Inject(forwardRef(() => GameGateway))
    private readonly gameGateway: GameGateway,
    @InjectRepository(GameResult)
    private readonly gameResultRepository: Repository<GameResult>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @InjectRepository(UserStats)
    private readonly userStatsRepository: Repository<UserStats>,
  ) {
    this.playersInQueueOrGame = [];
  }

  private readonly logger: Logger = new Logger(GameService.name);

  public isPlayerInQueueOrGame(playerUID: number): boolean {
    return this.playersInQueueOrGame.some(
      (player) => player.userId === playerUID,
    );
  }

  public queueToLadder(server: Server, player: Player): void {
    this.playersInQueueOrGame.push({
      clientId: player.client.id,
      userId: player.userId,
    });
    this.gameQueue.enqueue(player);
    this.usersService.updateUserStatusByUID(player.userId, UserStatus.IN_QUEUE);

    // If there's no other player waiting, keep him waiting
    if (this.gameQueue.size() === 1) {
      player.side = PlayerSide.LEFT;
    } else {
      player.side = PlayerSide.RIGHT;

      const playerOne: Player = this.gameQueue.dequeue();
      const playerTwo: Player = this.gameQueue.dequeue();

      this.joinPlayersToRoom(playerOne, playerTwo);
    }
  }

  public async disconnectPlayer(playerClientId: string): Promise<void> {
    const playerIds: PlayerIds | void =
      this.erasePlayerFromArray(playerClientId);

    if (playerIds) {
      await this.usersService.updateUserStatusByUID(
        playerIds.userId,
        UserStatus.ONLINE,
      );
    }

    this.gameQueue.removePlayerFromQueueByClientId(playerClientId);
  }

  public playerScored(gameRoomId: string, clientId: string): void {
    const gameRoom: GameRoom | undefined =
      this.gameRoomsMap.findGameRoomById(gameRoomId);
    if (!gameRoom) {
      return;
    }

    let updatedGameRoom: Partial<GameRoom>;

    if (gameRoom.leftPlayer.client.id === clientId) {
      // leftPlayer scored
      updatedGameRoom = {
        leftPlayer: {
          ...gameRoom.leftPlayer,
          score: gameRoom.leftPlayer.score + 1,
        },
      };
      if (updatedGameRoom.leftPlayer.score === MAX_SCORE) {
        this.gameEnded(
          gameRoomId,
          updatedGameRoom.leftPlayer,
          gameRoom.rightPlayer,
        );
        return;
      }
    } else {
      // rightPlayer scored
      updatedGameRoom = {
        rightPlayer: {
          ...gameRoom.rightPlayer,
          score: gameRoom.rightPlayer.score + 1,
        },
      };
      if (updatedGameRoom.rightPlayer.score === MAX_SCORE) {
        this.gameEnded(
          gameRoomId,
          updatedGameRoom.rightPlayer,
          gameRoom.leftPlayer,
        );
        return;
      }
    }
    this.gameRoomsMap.updateGameRoomById(gameRoomId, updatedGameRoom);
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

    if (
      updatedGameRoom[
        playerToUpdate === gameRoom.leftPlayer ? 'leftPlayer' : 'rightPlayer'
      ].paddleY < 0 ||
      updatedGameRoom[
        playerToUpdate === gameRoom.leftPlayer ? 'leftPlayer' : 'rightPlayer'
      ].paddleY >
        CANVAS_HEIGHT - CANVAS_HEIGHT_OFFSET
    ) {
      return;
    }
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

  private erasePlayerFromArray(playerClientId: string): PlayerIds | void {
    const indexOfPlayerToDisconnect: number =
      this.playersInQueueOrGame.findIndex((player) => {
        return player.clientId === playerClientId;
      });

    if (indexOfPlayerToDisconnect === -1) {
      return;
    }

    return this.playersInQueueOrGame.splice(indexOfPlayerToDisconnect, 1)[0];
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
    // assigned early based on who first entered the queue
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
  }

  private async emitOpponentFoundEvent(
    player: Player,
    roomId: string,
    opponentUID: number,
  ): Promise<void> {
    const opponentInfo = await this.usersService.findUserSearchInfoByUID(
      opponentUID,
    );
    player.client.emit('opponent-found', {
      roomId: roomId,
      side: player.side,
      opponentInfo: opponentInfo,
    });
  }

  private async gameEnded(
    roomId: string,
    winner: Player,
    loser: Player,
  ): Promise<void> {
    // !TODO
    // Remove the hard coded Game Type
    const gameEnd: GameEndDTO = {
      winner: { userId: winner.userId, score: winner.score },
      loser: { userId: loser.userId, score: loser.score },
    };

    this.gameGateway.broadcastGameEnd(roomId, gameEnd);
    this.gameRoomsMap.deleteGameRoomById(roomId);

    try {
      await this.saveGameResult(GameType.LADDER, winner, loser);
    } catch (error) {
      this.logger.error(
        'Someone tried to register a game where he was both the user and the loser',
      );
      return;
    }
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
    if (winner.userId === loser.userId) {
      throw new Error('Winner and loser cannot be the same player');
    }

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

import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameType } from 'src/common/types/game-type.enum';
import { PlayerSide } from 'src/common/types/player-side.enum';
import { UserSearchInfo } from 'src/common/types/user-search-info.interface';
import { UserStatus } from 'src/common/types/user-status.enum';
import { GameResult } from 'src/entity/game-result.entity';
import { User } from 'src/typeorm/index';
import { Repository } from 'typeorm';
import { AchievementService } from '../achievement/achievement.service';
import { UserStatsService } from '../user-stats/user-stats.service';
import { UsersService } from '../users/users.service';
import { Ball } from './Ball';
import { GameQueue } from './GameQueue';
import { GameRoom } from './GameRoom';
import { GameRoomsMap } from './GameRoomsMap';
import { Player } from './Player';
import { GameEngineService } from './game-engine.service';
import { GameGateway } from './game.gateway';

const GAME_START_TIMEOUT: number = 1000 * 3;

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
    private readonly userStatsService: UserStatsService,
    private readonly achievementsService: AchievementService,
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
      this.gameRoomsMap.findRoomWithPlayerByUID(playerUserId);

    /* If a room with the disconnecting player is found
    it's because he was on an on-going game.
    Upon game end we delete the gameRoom from the gameRoomsMap */
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
      const leavingPlayer: Player =
        this.gameQueue.removePlayerFromQueueByUID(playerUserId);

      await this.usersService.updateUserStatusByUID(
        leavingPlayer.userId,
        UserStatus.ONLINE,
      );
    }
  }

  public playerReady(gameRoomId: string, clientId: string) {
    let gameRoom: GameRoom | undefined =
      this.gameRoomsMap.findGameRoomById(gameRoomId);
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

    this.gameRoomsMap.updateGameRoomById(gameRoomId, updatedGameRoom);
    // Fetch the updated info from gameRoomsMap
    gameRoom = this.gameRoomsMap.findGameRoomById(gameRoomId);

    if (gameRoom.leftPlayer.isReady && gameRoom.rightPlayer.isReady) {
      setTimeout(() => {
        this.gameEngine.startGame(gameRoomId);
      }, GAME_START_TIMEOUT);
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
      // Access object thru dynamic object key
      [playerToUpdate === gameRoom.leftPlayer ? 'leftPlayer' : 'rightPlayer']: {
        ...playerToUpdate,
        paddleY: newY,
      },
    };

    this.gameRoomsMap.updateGameRoomById(gameRoomId, updatedGameRoom);
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
    roomId: string,
    winner: Player,
    loser: Player,
  ): Promise<void> {
    this.gameGateway.broadcastGameEnd(roomId, winner, loser);
    this.gameRoomsMap.deleteGameRoomByRoomId(roomId);

    // TODO
    // Remove the hard coded Game Type
    // when 1v1 is implemented
    await this.saveGameResult(GameType.LADDER, winner, loser);

    await this.achievementsService.grantWinsAchievementsIfEligible(
      winner.userId,
    );
    await this.achievementsService.grantLossesAchievementsIfEligible(
      loser.userId,
    );

    await this.userStatsService.updateUserStatsUponGameEnd(
      winner.userId,
      loser.userId,
    );
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

    // Emit 'opponentFound' event to both players
    await this.emitOpponentFoundEvent(playerOne, roomId, playerTwo.userId);
    await this.emitOpponentFoundEvent(playerTwo, roomId, playerOne.userId);
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

    player.client.emit('opponentFound', {
      roomId: roomId,
      side: player.side,
      opponentInfo: opponentInfo,
    });
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

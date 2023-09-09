import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameResult, User } from 'src/entity';
import { Repository } from 'typeorm';
import {
  GameInvite,
  GameType,
  PlayerSide,
  UserStatus,
} from 'types';
import { ConnectionGateway } from '../connection/connection.gateway';
import { UserStatsService } from '../user-stats/user-stats.service';
import { UsersService } from '../users/users.service';
import { Ball } from './Ball';
import { GameEngineService } from './game-engine.service';
import { GameGateway } from './game.gateway';
import { GameInviteMap } from './GameInviteMap';
import { GameQueue } from './GameQueue';
import { GameRoom } from './GameRoom';
import { GameRoomMap } from './GameRoomMap';
import { Player } from './Player';
import { nanoid } from 'nanoid';
import { ConnectionService } from '../connection/connection.service';

const GAME_START_TIMEOUT: number = 3 * 1000;

@Injectable()
export class GameService {
  constructor(
    private gameQueue: GameQueue,
    private gameRoomMap: GameRoomMap,
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
    @Inject(forwardRef(() => ConnectionService))
    private readonly connectionService: ConnectionService,
  ) {}

  public async sendGameInvite(senderUID: number, recipientUID: number): Promise<string> {
    if (this.isPlayerInQueueOrGame(senderUID)) {
      throw new ConflictException(
        'You cannot send a game invite while in a game',
      );
    }

    if (this.hasSenderAlreadySentGameInviteToThisReceiver(senderUID, recipientUID))
      throw new ConflictException('You have an active game invite to that user');

    if (this.isPlayerInQueueOrGame(recipientUID))
      throw new ConflictException('Recipient is in game');

    const socketIdOfPlayer: string | undefined =
      this.connectionService.findSocketIdByUID(senderUID);
    if (!socketIdOfPlayer) {
      throw new ConflictException(
        "You cannot send a game invite if you're offline",
      );
    }

    const newPlayer: Player = new Player(Number(senderUID), socketIdOfPlayer);
    newPlayer.setPlayerSide(PlayerSide.LEFT);

    const inviteId: string = this.gameInviteMap.createGameInvite({
      recipientUID: recipientUID,
      sender: newPlayer,
    });

    this.gameGateway.emitInvitedToGameEvent(recipientUID, {
      inviteId: inviteId,
      inviterUID: Number(senderUID),
    });

    return inviteId;
  }

  public async gameInviteAccepted(
    inviteId: string,
    receiver: number,
    receiverSocketId: string,
  ): Promise<void> {
    const gameInvite: GameInvite | undefined =
      this.gameInviteMap.findInviteById(inviteId);
    if (!gameInvite) throw new NotFoundException('Invite not found');

    this.gameInviteMap.deleteInviteByInviteId(inviteId);

    const recipientPlayer: Player = new Player(receiver, receiverSocketId);
    recipientPlayer.setPlayerSide(PlayerSide.RIGHT);

    this.joinPlayersToRoom(
      gameInvite.sender,
      recipientPlayer,
      GameType.ONEVSONE,
    );
  }

  public gameInviteDeclined(userId: number): void {
    this.gameGateway.emitGameInviteDeclined(userId);
  }

  public gameInviteCanceled(userId: number): void {
    this.gameGateway.emitGameInviteCanceled(userId);
  }

  /**
   * Disconnects a player from the game mechanism.
   *
   * If he was on the queue, leaves;
   * If he was an on an on-going game, the remaining player wins;
   * If he wasn't in neither of the above, does nothing;
   * @param playerUserId userId of the disconnecting player
   */
  public async disconnectPlayer(playerUserId: number): Promise<void> {
    this.deleteAllInvitesToUser(playerUserId);
    const playerRoom: GameRoom | null =
      this.gameRoomMap.findRoomWithPlayerByUID(playerUserId);

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
      await this.connectionGateway.updateUserStatus({
        uid: playerUserId,
        newStatus: UserStatus.ONLINE,
      });
    }
  }

  public findGameInviteByInviteId(inviteId: string): GameInvite | undefined {
    return this.gameInviteMap.findInviteById(inviteId);
  }

  public async findGameResultsWhereUserPlayed(
    userId: number,
  ): Promise<GameResult[]> {
    return await this.gameResultRepository.find({
      where: [{ winner: { id: userId } }, { loser: { id: userId } }],
      relations: { winner: true, loser: true },
    });
  }

  public async gameEnded(
    gameType: GameType,
    roomId: string,
    winner: Player,
    loser: Player,
    wonByDisconnection: boolean,
  ): Promise<void> {
    this.gameGateway.broadcastGameEnd(roomId, winner, loser);
    this.gameRoomMap.deleteGameRoomByRoomId(roomId);

    await this.saveGameResult(gameType, winner, loser);

    await this.connectionGateway.updateUserStatus({
      uid: winner.userId,
      newStatus: UserStatus.ONLINE,
    });
    await this.connectionGateway.updateUserStatus({
      uid: loser.userId,
      newStatus: UserStatus.ONLINE,
    });

    if (gameType === GameType.ONEVSONE) return;

    await this.userStatsService.updateUserStatsUponGameEnd(
      winner.userId,
      loser.userId,
      wonByDisconnection,
    );

    this.connectionGateway.sendRefreshUser(winner.userId, winner.socketId);
    this.connectionGateway.sendRefreshUser(loser.userId, loser.socketId);
  }

  public isPlayerInQueueOrGame(playerUID: number): boolean {
    return (
      this.gameQueue.isPlayerInQueue(playerUID) ||
      this.gameRoomMap.isPlayerInGame(playerUID)
    );
  }

  public async joinPlayersToRoom(
    playerOne: Player,
    playerTwo: Player,
    gameType: GameType,
  ): Promise<void> {
    const roomId: string = nanoid();

    // Join both players to the same room
    this.connectionGateway.server.to(playerOne.socketId).socketsJoin(roomId);
    this.connectionGateway.server.to(playerTwo.socketId).socketsJoin(roomId);

    // Determine the left and right players based on their 'side' property
    // assigned earlier based on who first entered the queue
    const { leftPlayer, rightPlayer } =
      playerOne.side === PlayerSide.LEFT
        ? { leftPlayer: playerOne, rightPlayer: playerTwo }
        : { leftPlayer: playerTwo, rightPlayer: playerOne };

    this.gameRoomMap.createNewGameRoom({
      ball: new Ball(),
      gameType: gameType,
      leftPlayer: leftPlayer,
      rightPlayer: rightPlayer,
      roomId: roomId,
    });

    // Emit 'opponentFound' event to both players
    this.gameGateway.emitOpponentFoundEvent(playerOne.socketId, {
      roomId: roomId,
      side: playerOne.side,
      opponentInfo: await this.usersService.findUserBasicProfileByUID(
        playerTwo.userId,
      ),
    });

    this.gameGateway.emitOpponentFoundEvent(playerTwo.socketId, {
      roomId: roomId,
      side: playerTwo.side,
      opponentInfo: await this.usersService.findUserBasicProfileByUID(
        playerOne.userId,
        ),
    });
  }

  public paddleMove(gameRoomId: string, socketId: string, newY: number): void {
    const gameRoom: GameRoom | undefined =
      this.gameRoomMap.findGameRoomById(gameRoomId);
    if (!gameRoom) {
      return;
    }

    const playerToUpdate: Player =
      gameRoom.leftPlayer.socketId === socketId
        ? gameRoom.leftPlayer
        : gameRoom.rightPlayer;

    const updatedGameRoom: Partial<GameRoom> = {
      // Access object thru dynamic object key
      [playerToUpdate === gameRoom.leftPlayer ? 'leftPlayer' : 'rightPlayer']: {
        ...playerToUpdate,
        paddleY: newY,
      },
    };

    this.gameRoomMap.updateGameRoomById(gameRoomId, updatedGameRoom);
  }

  public async playerReady(gameRoomId: string, socketId: string) {
    let gameRoom: GameRoom | undefined =
      this.gameRoomMap.findGameRoomById(gameRoomId);

    // In case the other player leaves (and consequently delete the game room)
    // this if prevents this player of accessing the undefined object
    if (!gameRoom) return;

    const playerToUpdate: Player =
      gameRoom.leftPlayer.socketId === socketId
        ? gameRoom.leftPlayer
        : gameRoom.rightPlayer;

    const updatedGameRoom: Partial<GameRoom> = {
      // Access object thru dynamic object key
      [playerToUpdate === gameRoom.leftPlayer ? 'leftPlayer' : 'rightPlayer']: {
        ...playerToUpdate,
        isReady: true,
      },
    };

    this.gameRoomMap.updateGameRoomById(gameRoomId, updatedGameRoom);
    // Fetch the updated info from gameRoomMap
    gameRoom = this.gameRoomMap.findGameRoomById(gameRoomId);

    if (gameRoom.leftPlayer.isReady && gameRoom.rightPlayer.isReady) {
      await this.connectionGateway.updateUserStatus({
        uid: gameRoom.rightPlayer.userId,
        newStatus: UserStatus.IN_GAME,
      });
      await this.connectionGateway.updateUserStatus({
        uid: gameRoom.leftPlayer.userId,
        newStatus: UserStatus.IN_GAME,
      });

      setTimeout(() => {
        this.gameEngine.startGame(gameRoomId);
      }, GAME_START_TIMEOUT);
    }
  }

  public async queueToLadder(player: Player): Promise<void> {
    this.gameQueue.enqueue(player);
    await this.connectionGateway.updateUserStatus({
      uid: player.userId,
      newStatus: UserStatus.IN_QUEUE,
    });

    // If there's no more players on the queue, assign the left side and keep him waiting
    if (this.gameQueue.size() === 1) {
      player.setPlayerSide(PlayerSide.LEFT);
    } else if (this.gameQueue.size() >= 2) {
      player.setPlayerSide(PlayerSide.RIGHT);

      const playerOne: Player = this.gameQueue.dequeue();
      const playerTwo: Player = this.gameQueue.dequeue();

      this.joinPlayersToRoom(playerOne, playerTwo, GameType.LADDER);
      
      this.deleteAllInvitesToUser(playerOne.userId);
      this.deleteAllInvitesToUser(playerTwo.userId);
    }
  }

  public correctInviteUsage(userId: number, inviteId: string, cancelInvite: boolean): boolean {
    const gameInvite: GameInvite | undefined =
      this.gameInviteMap.findInviteById(inviteId);
    
    if (!gameInvite) throw new NotFoundException('Invite not found');

    if (cancelInvite) return gameInvite.sender.userId == userId;
    return gameInvite.recipientUID == userId;
  }

  public hasSenderAlreadySentGameInviteToThisReceiver(senderId: number, receiverId: number): boolean {
    const allInvitesToUser: GameInvite[] =
      this.gameInviteMap.findAllInvitesWithUser(senderId);

    allInvitesToUser.forEach((invite: GameInvite): boolean | void => {
      if (invite.sender.userId == senderId && invite.recipientUID == receiverId)
        return true;
    })

    return false;
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
      loser: loserUser,
      loser_score: loser.score,
      winner: winnerUser,
      winner_score: winner.score,
    });
    await this.gameResultRepository.save(newGameResult);
  }

  private deleteAllInvitesToUser(userId: number): void {
    const invites: GameInvite[] = this.gameInviteMap.findAllInvitesWithUser(userId);
    if (invites.length === 0) return;
    
    invites.forEach((invite: GameInvite): void => {
      if (userId == invite.sender.userId)
        this.gameInviteCanceled(userId);
      else
        this.gameInviteDeclined(userId);
    });
  }
}

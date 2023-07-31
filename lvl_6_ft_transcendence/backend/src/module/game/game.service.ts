import { Injectable, Logger } from '@nestjs/common';
import { GameQueue } from './GameQueue';
import { GameRoomsMap } from './GameRoomsMap';
import { UsersService } from '../users/users.service';
import { UserStatus } from 'src/common/types/user-status.enum';
import { Server } from 'socket.io';
import { UserSearchInfo } from 'src/common/types/user-search-info.interface';
import { GameType } from 'src/common/types/game-type.enum';
import { PlayerSide } from 'src/common/types/player-side.enum';
import {
  Ball,
  CANVAS_HEIGHT,
  GameRoom,
  PADDLE_VELOCITY,
  Player,
} from './game-room';

@Injectable()
export class GameService {
  constructor(
    private gameQueue: GameQueue,
    private gameRoomsMap: GameRoomsMap,
    private usersService: UsersService,
  ) {}

  private readonly logger: Logger = new Logger(GameService.name);

  public queueToLadder(server: Server, player: Player): void {
    this.gameQueue.enqueue(player);
    this.usersService.updateUserStatusByUID(player.userId, UserStatus.IN_QUEUE);

    // If there's no other player waiting, keep him waiting
    if (this.gameQueue.size() === 1) {
      player.side = PlayerSide.LEFT;
    } else {
      player.side = PlayerSide.RIGHT;

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

  public playerScored(gameRoomId: string, clientId: string): void {
    const gameRoom: GameRoom | undefined =
      this.gameRoomsMap.findGameRoomById(gameRoomId);
    if (!gameRoom) {
      return;
    }

    let updatedGameRoom: Partial<GameRoom>;
    if (gameRoom.leftPlayer.client.id === clientId) {
      updatedGameRoom = {
        leftPlayer: {
          ...gameRoom.leftPlayer,
          score: gameRoom.leftPlayer.score + 1,
        },
      };
    } else {
      updatedGameRoom = {
        rightPlayer: {
          ...gameRoom.rightPlayer,
          score: gameRoom.rightPlayer.score + 1,
        },
      };
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
      ].paddleY > CANVAS_HEIGHT
    ) {
      return;
    }
    this.gameRoomsMap.updateGameRoomById(gameRoomId, updatedGameRoom);
  }

  public getGameRoomInfo(gameRoomId: string): GameRoom | undefined {
    return this.gameRoomsMap.findGameRoomById(gameRoomId);
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

    // server.to(roomId).emit('game-data', GameData);
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
}

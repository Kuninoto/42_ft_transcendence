import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { corsOption } from 'src/common/options/cors.option';
import { GameService } from './game.service';
import { AuthService } from '../auth/auth.service';
import { Logger } from '@nestjs/common';
import { GameRoom, GameRoomInfo } from './GameRoom';
import { Player } from './Player';
import { PaddleMoveDTO } from './dto/paddle-move.dto';
import { PlayerIds } from 'src/common/types/player-interface.interface';
import { UserStatus } from 'src/common/types/user-status.enum';

@WebSocketGateway({ namespace: 'game-gateway', cors: corsOption })
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  public server: Server;

  private playersInQueueOrGame: PlayerIds[];

  constructor(
    private readonly gameService: GameService,
    private readonly authService: AuthService,
  ) {
    this.playersInQueueOrGame = [];
  }

  private readonly logger: Logger = new Logger(GameGateway.name);

  afterInit(server: Server): void {
    this.logger.log('Game-gateway Initialized');
  }

  // On socket connection checks if the user is authenticated
  async handleConnection(client: Socket): Promise<void> {
    this.logger.log('Player connected ' + client.id);
    try {
      const userId: number = await this.authService.authenticateClientAndRetrieveUID(client);
      if (this.isPlayerInQueueOrGame(userId)) {
        throw new Error('Duplicate player connected');
      }

      const newPlayer: Player = new Player(client, userId);
      this.playersInQueueOrGame.push({
        clientId: newPlayer.client.id,
        userId: newPlayer.userId,
      });
      this.gameService.queueToLadder(this.server, newPlayer);
    } catch (error) {
      this.logger.error(error.message + ", disconnecting...");
      // Due to lifecycle hooks, this line calls handleDisconnect();
      // Refer to: https://docs.nestjs.com/websockets/gateways
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    this.disconnectPlayer(client.id);
    this.logger.log('Player disconnected ' + client.id);
  }

  private disconnectPlayer(clientId: string) {
    const disconnectedPlayerIds: PlayerIds = this.erasePlayerFromArray(clientId);
    this.gameService.leaveLadderQueue(disconnectedPlayerIds);
  }

  // Listen for 'paddle-move' messages
  @SubscribeMessage('paddle-move')
  paddleMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: PaddleMoveDTO,
  ): void {
    this.gameService.paddleMove(
      messageBody.gameRoomId,
      client.id,
      messageBody.newY,
    );
    this.broadcastGameRoomInfo(messageBody.gameRoomId);
    console.debug(this.gameService.getGameRoomInfo(messageBody.gameRoomId));
  }

  // Listen for 'player-scored' messages
  @SubscribeMessage('player-scored')
  playerScored(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: { gameRoomId: string },
  ): void {
    this.gameService.playerScored(messageBody.gameRoomId, client.id);
    this.broadcastGameRoomInfo(messageBody.gameRoomId);
    console.debug(this.gameService.getGameRoomInfo(messageBody.gameRoomId));
  }

  broadcastGameRoomInfo(roomId: string): void {
    const gameRoom: GameRoom | undefined =
      this.gameService.getGameRoomInfo(roomId);

    if (!gameRoom) {
      return;
    }

    const { ball, leftPlayer, rightPlayer } = gameRoom;
    
    const gameRoomInfo: GameRoomInfo = {
      ball: { x: ball.x, y: ball.y },
      leftPlayer: { paddleY: leftPlayer.paddleY, score: leftPlayer.score },
      rightPlayer: { paddleY: rightPlayer.paddleY, score: rightPlayer.score },
    };
    this.server.to(roomId).emit('game-room-info', gameRoomInfo);
  }

  /* broadcastGameEnd(): void {
    const gameEnd: GameEnd = ;
    this.server.to(gameId).emit('game-end', gameEnd);
  } */

  private erasePlayerFromArray(playerClientId: string): PlayerIds | undefined {
    const indexOfPlayerToDisconnect: number =
      this.playersInQueueOrGame.findIndex((player) => {
        return player.clientId === playerClientId;
      });
    if (indexOfPlayerToDisconnect !== -1) {
      return this.playersInQueueOrGame.splice(indexOfPlayerToDisconnect, 1)[0];
    }
  }

  private isPlayerInQueueOrGame(playerUID: number): boolean {
    return this.playersInQueueOrGame.some(
      (player) => player.userId === playerUID,
    );
  }
}

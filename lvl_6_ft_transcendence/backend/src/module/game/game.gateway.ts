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
import { Inject, Logger, forwardRef } from '@nestjs/common';
import { GameRoom, GameRoomInfoDTO } from './GameRoom';
import { Player } from './Player';
import { PaddleMoveDTO } from './dto/paddle-move.dto';
import { PlayerIds } from 'src/common/types/player-interface.interface';
import { GameEndDTO } from './dto/game-end.dto';

@WebSocketGateway({ namespace: 'game-gateway', cors: corsOption })
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  public server: Server;

  constructor(
    @Inject(forwardRef(() => GameService))
    private readonly gameService: GameService,
    private readonly authService: AuthService,
  ) {}

  private readonly logger: Logger = new Logger(GameGateway.name);

  afterInit(server: Server): void {
    this.logger.log('Game-gateway Initialized');
  }

  async handleConnection(client: Socket): Promise<void> {
    this.logger.log('Player connected ' + client.id);
    try {
      const userId: number =
        await this.authService.authenticateClientAndRetrieveUID(client);
      //if (this.gameService.isPlayerInQueueOrGame(userId)) {
      //  throw new Error('Player was already connected');
      //}

      const newPlayer: Player = new Player(client, userId);
      this.gameService.queueToLadder(this.server, newPlayer);
    } catch (error) {
      this.logger.error(error.message + ', disconnecting...');
      // Due to lifecycle hooks, this line calls handleDisconnect();
      // Refer to: https://docs.nestjs.com/websockets/gateways
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    await this.gameService.disconnectPlayer(client.id);
    this.logger.log('Player disconnected ' + client.id);
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
  }

  broadcastGameRoomInfo(roomId: string): void {
    const gameRoom: GameRoom | undefined =
      this.gameService.getGameRoomInfo(roomId);

    if (!gameRoom) {
      return;
    }

    const { ball, leftPlayer, rightPlayer } = gameRoom;

    const gameRoomInfo: GameRoomInfoDTO = {
      ball: { x: ball.x, y: ball.y },
      leftPlayer: { paddleY: leftPlayer.paddleY, score: leftPlayer.score },
      rightPlayer: { paddleY: rightPlayer.paddleY, score: rightPlayer.score },
    };
    this.server.to(roomId).emit('game-room-info', gameRoomInfo);
  }

  broadcastGameEnd(roomId: string, gameEndDto: GameEndDTO): void {
    this.server.to(roomId).emit('game-end', gameEndDto);
  }
}

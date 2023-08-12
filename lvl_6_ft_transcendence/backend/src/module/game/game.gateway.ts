import { Inject, Logger, forwardRef } from '@nestjs/common';
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
import { GatewayCorsOption } from 'src/common/options/cors.option';
import { AuthService } from '../auth/auth.service';
import { CANVAS_HEIGHT, CANVAS_HEIGHT_OFFSET, GameRoom } from './GameRoom';
import { Player } from './Player';
import { GameEndDTO } from './dto/game-end.dto';
import { GameRoomInfoDTO } from './dto/game-room-info.dto';
import { PaddleMoveDTO } from './dto/paddle-move.dto';
import { PlayerReadyDTO } from './dto/player-ready.dto';
import { PlayerScoredDTO } from './dto/player-scored.dto';
import { GameService } from './game.service';

@WebSocketGateway({ namespace: 'game-gateway', cors: GatewayCorsOption })
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

      if (this.gameService.isPlayerInQueueOrGame(userId)) {
        throw new Error('Player already connected');
      }

      // Attach this info to the socket info so that later
      // we can distinguish the reason of the disconnection
      client.data.disconnectedByServer = false;
      const newPlayer: Player = new Player(client, userId);
      this.gameService.queueToLadder(newPlayer);
    } catch (error) {
      this.logger.error(error.message + ', disconnecting...');

      client.data.disconnectedByServer = true;
      // Due to lifecycle hooks, this line calls handleDisconnect();
      // Refer to: https://docs.nestjs.com/websockets/gateways
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    if (client.data.disconnectedByServer === false) {
      await this.gameService.disconnectPlayer(client.id);
    }
    this.logger.log('Player disconnected ' + client.id);
  }

  // Listen for 'player-ready' messages
  @SubscribeMessage('player-ready')
  playerReady(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: PlayerReadyDTO,
  ): void {
    if (!this.isValidPlayerReadyMessage(messageBody)) {
      this.logger.error(
        'Client id=' + client.id + ' tried to send a wrong PlayerReadyDTO',
      );
      return;
    }

    this.gameService.playerReady(messageBody.gameRoomId, client.id);
  }

  // Listen for 'paddle-move' messages
  @SubscribeMessage('paddle-move')
  paddleMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: PaddleMoveDTO,
  ): void {
    if (!this.isValidPaddleMoveMessage(messageBody)) {
      this.logger.error(
        'Client id=' + client.id + ' tried to send a wrong PaddleMoveDTO',
      );
      return;
    }

    this.gameService.paddleMove(
      messageBody.gameRoomId,
      client.id,
      messageBody.newY,
    );
  }

  broadcastGameRoomInfo(gameRoom: GameRoom): void {
    if (!gameRoom) {
      return;
    }

    const { ball, leftPlayer, rightPlayer } = gameRoom;

    const gameRoomInfo: GameRoomInfoDTO = {
      ball: { x: ball.x, y: ball.y },
      leftPlayer: { paddleY: leftPlayer.paddleY },
      rightPlayer: { paddleY: rightPlayer.paddleY },
    };
    this.server.to(gameRoom.roomId).emit('game-room-info', gameRoomInfo);
  }

  broadcastGameEnd(gameRoomId: string, winner: Player, loser: Player): void {
    const gameEndDto: GameEndDTO = {
      winner: { userId: winner.userId, score: winner.score },
      loser: { userId: loser.userId, score: loser.score },
    };
    this.server.to(gameRoomId).emit('game-end', gameEndDto);
  }

  emitPlayerScoredEvent(
    gameRoomId: string,
    leftPlayerScore: number,
    rightPlayerScore: number,
  ) {
    const playerScoredDTO: PlayerScoredDTO = {
      leftPlayerScore: leftPlayerScore,
      rightPlayerScore: rightPlayerScore,
    };

    this.server.to(gameRoomId).emit('player-scored', playerScoredDTO);
  }

  private isValidPaddleMoveMessage(
    messageBody: any,
  ): messageBody is PaddleMoveDTO {
    if (
      !(
        typeof messageBody === 'object' &&
        typeof messageBody.gameRoomId === 'string' &&
        typeof messageBody.newY === 'number'
      )
    ) {
      return false;
    }

    const message: PaddleMoveDTO = messageBody;
    if (
      message.newY < 0 ||
      message.newY > CANVAS_HEIGHT - CANVAS_HEIGHT_OFFSET
    ) {
      return false;
    }

    return true;
  }

  private isValidPlayerReadyMessage(
    messageBody: any,
  ): messageBody is PlayerReadyDTO {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.gameRoomId === 'string'
    );
  }
}

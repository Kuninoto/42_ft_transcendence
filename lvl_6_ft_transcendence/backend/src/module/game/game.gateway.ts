import { forwardRef, Inject, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GatewayCorsOption } from 'src/common/option/cors.option';
import {
  GameEndEvent,
  GameInviteCanceledEvent,
  GameRoomInfoEvent,
  InvitedToGameEvent,
  OpponentFoundEvent,
  PaddleMoveMessage,
  PlayerReadyMessage,
  PlayerScoredEvent,
} from 'types';
import { ConnectionGateway } from '../connection/connection.gateway';
import { ConnectionService } from '../connection/connection.service';
import { GameService } from './game.service';
import { CANVAS_HEIGHT, GameRoom } from './GameRoom';
import { PADDLE_HEIGHT, Player } from './Player';

@WebSocketGateway({
  cors: GatewayCorsOption,
  namespace: 'connection',
})
export class GameGateway implements OnGatewayInit {
  constructor(
    @Inject(forwardRef(() => GameService))
    private readonly gameService: GameService,
    @Inject(forwardRef(() => ConnectionGateway))
    private readonly connectionGateway: ConnectionGateway,
    @Inject(forwardRef(() => ConnectionService))
    private readonly connectionService: ConnectionService,
  ) {}

  private readonly logger: Logger = new Logger(GameGateway.name);

  /******************************
   *          MESSAGES          *
   ******************************/

  afterInit(server: Server) {
    this.logger.log('Game-Gateway Initialized');
  }

  @SubscribeMessage('queueToLadder')
  async queueToLadder(@ConnectedSocket() client: Socket): Promise<void> {
    if (this.gameService.isPlayerInQueueOrGame(client.data.userId)) return;

    this.logger.log(`${client.data.name} joined the ladder queue`);

    const newPlayer: Player = new Player(client.data.userId, client.id);
    await this.gameService.queueToLadder(newPlayer);
  }

  @SubscribeMessage('leaveQueueOrGame')
  async leaveQueueOrGame(@ConnectedSocket() client: Socket): Promise<void> {
    await this.gameService.disconnectPlayer(client.data.userId);
    this.logger.log(
      `${client.data.name} left the queue (possibly canceling game invites) or a game`,
    );
  }

  @SubscribeMessage('playerReady')
  playerReady(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: PlayerReadyMessage,
  ): void {
    if (!this.isValidPlayerReadyMessage(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong PlayerReadyMessage`,
      );
      throw new WsException('Wrongly formated message');
    }

    this.gameService.playerReady(messageBody.gameRoomId, client.id);
  }

  @SubscribeMessage('paddleMove')
  paddleMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: PaddleMoveMessage,
  ): void {
    if (!this.isValidPaddleMoveMessage(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong PaddleMoveMessage`,
      );
      throw new WsException('Wrongly formated message');
    }

    this.gameService.paddleMove(
      messageBody.gameRoomId,
      client.id,
      messageBody.newY,
    );
  }

  /******************************
   *           EVENTS           *
   ******************************/

  public emitGameInviteDeclined(userId: number): void {
    const receiverSocketId: string =
      this.connectionService.findSocketIdByUID(userId);

    this.connectionGateway.server
      .to(receiverSocketId)
      .emit('gameInviteDeclined');
  }

  public emitGameInviteCanceled(userId: number, inviteId: string): void {
    const receiverSocketId: string =
      this.connectionService.findSocketIdByUID(userId);

    const gameInviteCanceledEvent: GameInviteCanceledEvent = { inviteId: inviteId };
  
    this.connectionGateway.server
      .to(receiverSocketId)
      .emit('gameInviteCanceled', gameInviteCanceledEvent);
  }

  public emitInvitedToGameEvent(
    receiverUID: number,
    event: InvitedToGameEvent,
  ): void {
    const receiverSocketId: string =
      this.connectionService.findSocketIdByUID(receiverUID);

    this.connectionGateway.server
      .to(receiverSocketId)
      .emit('invitedToGame', event);
  }

  public emitOpponentFoundEvent(
    playerSocketId: string,
    event: OpponentFoundEvent,
  ): void {
    this.connectionGateway.server
      .to(playerSocketId)
      .emit('opponentFound', event);
  }

  public broadcastPlayerScoredEvent(
    gameRoomId: string,
    leftPlayerScore: number,
    rightPlayerScore: number,
  ): void {
    const playerScoredEvent: PlayerScoredEvent = {
      leftPlayerScore: leftPlayerScore,
      rightPlayerScore: rightPlayerScore,
    };

    this.connectionGateway.server
      .to(gameRoomId)
      .emit('playerScored', playerScoredEvent);
  }

  public broadcastGameRoomInfo(gameRoom: GameRoom): void {
    const { ball, leftPlayer, rightPlayer } = gameRoom;

    const gameRoomInfo: GameRoomInfoEvent = {
      ball: { x: ball.x, y: ball.y },
      leftPlayer: { paddleY: leftPlayer.paddleY },
      rightPlayer: { paddleY: rightPlayer.paddleY },
    };
    this.connectionGateway.server
      .to(gameRoom.roomId)
      .emit('gameRoomInfo', gameRoomInfo);
  }

  public broadcastGameEnd(
    gameRoomId: string,
    winner: Player,
    loser: Player,
  ): void {
    const gameEnd: GameEndEvent = {
      loser: { score: loser.score, userId: loser.userId },
      winner: { score: winner.score, userId: winner.userId },
    };
    this.connectionGateway.server.to(gameRoomId).emit('gameEnd', gameEnd);
  }

  private isValidPaddleMoveMessage(
    messageBody: any,
  ): messageBody is PaddleMoveMessage {
    if (
      !(
        typeof messageBody === 'object' &&
        typeof messageBody.gameRoomId === 'string' &&
        typeof messageBody.newY === 'number'
      )
    ) {
      return false;
    }

    const message: PaddleMoveMessage = messageBody;
    if (
      message.newY - PADDLE_HEIGHT / 2 < 0 ||
      message.newY + PADDLE_HEIGHT / 2 > CANVAS_HEIGHT
    ) {
      return false;
    }

    return true;
  }

  private isValidPlayerReadyMessage(
    messageBody: any,
  ): messageBody is PlayerReadyMessage {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.gameRoomId === 'string'
    );
  }
}

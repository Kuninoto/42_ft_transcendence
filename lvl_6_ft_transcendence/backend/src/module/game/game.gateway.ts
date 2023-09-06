import { forwardRef, Inject, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { UUID } from 'crypto';
import { Server, Socket } from 'socket.io';
import { GatewayCorsOption } from 'src/common/option/cors.option';
import {
  GameEndEvent,
  GameRoomInfoEvent,
  InvitedToGameEvent,
  OpponentFoundEvent,
  PaddleMoveMessage,
  PlayerReadyMessage,
  PlayerScoredEvent,
  PlayerSide,
  RespondToGameInviteMessage,
  SendGameInviteMessage,
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
    this.logger.log(`${client.data.name} joined the ladder queue`);
    if (this.gameService.isPlayerInQueueOrGame(client.data.userId)) {
      return;
    }

    const newPlayer: Player = new Player(client, client.data.userId);
    await this.gameService.queueToLadder(newPlayer);
  }

  @SubscribeMessage('leaveQueueOrGame')
  async leaveQueueOrGame(@ConnectedSocket() client: Socket): Promise<void> {
    this.logger.log(`${client.data.name} left the queue or a game`);
    await this.gameService.disconnectPlayer(client.data.userId);
  }

  @SubscribeMessage('sendGameInvite')
  async sendGameInvite(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: SendGameInviteMessage,
  ): Promise<void> {
    if (!this.isValidSendGameInviteMessage(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong SendGameInviteMessage`,
      );
      return;
    }

    if (
      this.gameService.isPlayerInQueueOrGame(client.data.userId) ||
      this.gameService.isPlayerInQueueOrGame(messageBody.recipientUID)
    ) {
      this.logger.warn(
        `${client.data.name} tried to send a game invite while in game or to a recipient in game`,
      );
      return;
    }

    const newPlayer: Player = new Player(client, client.data.userId);
    newPlayer.setPlayerSide(PlayerSide.LEFT);

    const inviteId: UUID = this.gameService.createGameInvite({
      recipientUID: messageBody.recipientUID,
      sender: newPlayer,
    });

    this.emitInvitedToGameEvent(messageBody.recipientUID, {
      inviteId: inviteId,
      inviterUID: client.data.userId,
    });
  }

  @SubscribeMessage('respondToGameInvite')
  async respondToGameInvite(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: RespondToGameInviteMessage,
  ): Promise<void> {
    if (!this.isValidRespondToGameInviteMessage(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong RespondToGameInviteMessage`,
      );
      return;
    }

    if (
      !this.gameService.correctInviteUsage(
        client.data.userId,
        messageBody.inviteId,
      )
    )
      return;

    if (messageBody.accepted === true) {
      await this.gameService.gameInviteAccepted(messageBody.inviteId, client);
    } else {
      this.gameService.gameInviteDeclined(messageBody.inviteId);
    }
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
      return;
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
      return;
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

  public emitInvitedToGameEvent(
    recipientUID: number,
    event: InvitedToGameEvent,
  ): void {
    const recipientSocketId: string =
      this.connectionService.findSocketIdByUID(recipientUID);

    this.connectionGateway.server
      .to(recipientSocketId)
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

  private isValidRespondToGameInviteMessage(
    messageBody: any,
  ): messageBody is RespondToGameInviteMessage {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.inviteId === 'string' &&
      typeof messageBody.accepted === 'boolean'
    );
  }

  private isValidSendGameInviteMessage(
    messageBody: any,
  ): messageBody is SendGameInviteMessage {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.recipientUID === 'number'
    );
  }
}

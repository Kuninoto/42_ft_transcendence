import { forwardRef, Inject, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GatewayCorsOption } from 'src/common/option/cors.option';
import { GameEndResponse, GameRoomInfoResponse, InvitedToGameResponse, PaddleMoveRequest, PlayerReadyRequest, PlayerScoredResponse, PlayerSide, RespondToGameInviteRequest, SendGameInviteRequest } from 'types';
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
  private readonly logger: Logger = new Logger(GameGateway.name);

  constructor(
    @Inject(forwardRef(() => GameService))
    private readonly gameService: GameService,
    @Inject(forwardRef(() => ConnectionGateway))
    private readonly connectionGateway: ConnectionGateway,
    @Inject(forwardRef(() => ConnectionService))
    private readonly connectionService: ConnectionService,
  ) {}

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
    @MessageBody() messageBody: SendGameInviteRequest,
  ): Promise<void> {
    if (!this.isValidSendGameInviteRequest(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong SendGameInviteRequest`,
      );
      return;
    }

    if (
      this.gameService.isPlayerInQueueOrGame(client.data.userId) ||
      this.gameService.isPlayerInQueueOrGame(parseInt(messageBody.recipientUID))
    ) {
      this.logger.warn(
        `${client.data.name} tried to send a game invite while in game or to a recipient in game`,
      );
      return;
    }

    const newPlayer: Player = new Player(client, client.data.userId);
    newPlayer.setPlayerSide(PlayerSide.LEFT);

    const inviteId: number = this.gameService.createGameInvite({
      recipientUID: messageBody.recipientUID,
      sender: newPlayer,
    });

    const recipientSocketId: string = this.connectionService.findSocketIdByUID(
      messageBody.recipientUID.toString(),
    );

    const invitedToGame: InvitedToGameResponse = {
      inviteId: inviteId,
      senderUID: client.data.userId,
    };

    this.connectionGateway.server
      .to(recipientSocketId)
      .emit('invitedToGame', invitedToGame);
  }

  /**
   * Listen to 'respondToGameInvite' messages
   *
   * @param client client's socket
   * @param messageBody body of the received message
   */
  @SubscribeMessage('respondToGameInvite')
  async respondToGameInvite(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: RespondToGameInviteRequest,
  ): Promise<void> {
    if (!this.isValidRespondToGameInviteRequest(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong RespondToGameInviteRequest`,
      );
      return;
    }

    if (messageBody.accepted === true) {
      await this.gameService.gameInviteAccepted(messageBody.inviteId, client);
    } else {
      this.gameService.gameInviteDeclined(messageBody.inviteId);
    }
  }

  /**
   * Listen to 'playerReady' messages
   *
   * @param client client's socket
   * @param messageBody body of the received message
   */
  @SubscribeMessage('playerReady')
  playerReady(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: PlayerReadyRequest,
  ): void {
    if (!this.isValidPlayerReadyRequest(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong PlayerReadyRequest`,
      );
      return;
    }

    this.gameService.playerReady(messageBody.gameRoomId, client.id);
  }

  /*
   * Listen to 'paddleMove' messages
   */
  @SubscribeMessage('paddleMove')
  paddleMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: PaddleMoveRequest,
  ): void {
    if (!this.isValidPaddleMoveRequest(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong PaddleMoveRequest`,
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

  public broadcastGameRoomInfo(gameRoom: GameRoom): void {
    const { ball, leftPlayer, rightPlayer } = gameRoom;

    const gameRoomInfo: GameRoomInfoResponse = {
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
    const gameEnd: GameEndResponse = {
      loser: { score: loser.score, userId: loser.userId },
      winner: { score: winner.score, userId: winner.userId },
    };
    this.connectionGateway.server.to(gameRoomId).emit('gameEnd', gameEnd);
  }

  public emitPlayerScoredEvent(
    gameRoomId: string,
    leftPlayerScore: number,
    rightPlayerScore: number,
  ) {
    const playerScoredResponse: PlayerScoredResponse = {
      leftPlayerScore: leftPlayerScore,
      rightPlayerScore: rightPlayerScore,
    };

    this.connectionGateway.server
      .to(gameRoomId)
      .emit('playerScored', playerScoredResponse);
  }

  private isValidPaddleMoveRequest(
    messageBody: any,
  ): messageBody is PaddleMoveRequest {
    if (
      !(
        typeof messageBody === 'object' &&
        typeof messageBody.gameRoomId === 'string' &&
        typeof messageBody.newY === 'number'
      )
    ) {
      return false;
    }

    const message: PaddleMoveRequest = messageBody;
    if (
      message.newY - PADDLE_HEIGHT / 2 < 0 ||
      message.newY + PADDLE_HEIGHT / 2 > CANVAS_HEIGHT
    ) {
      return false;
    }

    return true;
  }

  private isValidPlayerReadyRequest(
    messageBody: any,
  ): messageBody is PlayerReadyRequest {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.gameRoomId === 'string'
    );
  }

  private isValidRespondToGameInviteRequest(
    messageBody: any,
  ): messageBody is RespondToGameInviteRequest {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.inviteId === 'number' &&
      typeof messageBody.accepted === 'boolean'
    );
  }

  private isValidSendGameInviteRequest(
    messageBody: any,
  ): messageBody is SendGameInviteRequest {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.recipientUID === 'string'
    );
  }
}

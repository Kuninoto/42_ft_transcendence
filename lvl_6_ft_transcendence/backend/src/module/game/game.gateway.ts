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
import { PlayerSide } from 'types';
import { ConnectionGateway } from '../connection/connection.gateway';
import { ConnectionService } from '../connection/connection.service';
import { GameEndDTO } from './dto/game-end.dto';
import { GameRoomInfoDTO } from './dto/game-room-info.dto';
import { InvitedToGameDTO } from './dto/invited-to-game.dto';
import { PaddleMoveDTO } from './dto/paddle-move.dto';
import { PlayerReadyDTO } from './dto/player-ready.dto';
import { PlayerScoredDTO } from './dto/player-scored.dto';
import { RespondToGameInviteDTO } from './dto/respond-to-game-invite.dto';
import { SendGameInviteDTO } from './dto/send-game-invite.dto';
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
    @MessageBody() messageBody: SendGameInviteDTO,
  ): Promise<void> {
    if (!this.isValidSendGameInviteMessage(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong SendGameInviteDTO`,
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

    const invitedToGame: InvitedToGameDTO = {
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
    @MessageBody() messageBody: RespondToGameInviteDTO,
  ): Promise<void> {
    if (!this.isValidRespondToGameInviteMessage(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong RespondToGameInviteDTO`,
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
    @MessageBody() messageBody: PlayerReadyDTO,
  ): void {
    if (!this.isValidPlayerReadyMessage(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong PlayerReadyDTO`,
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
    @MessageBody() messageBody: PaddleMoveDTO,
  ): void {
    if (!this.isValidPaddleMoveMessage(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong PaddleMoveDTO`,
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

    const gameRoomInfo: GameRoomInfoDTO = {
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
    const gameEnd: GameEndDTO = {
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
    const playerScoredDTO: PlayerScoredDTO = {
      leftPlayerScore: leftPlayerScore,
      rightPlayerScore: rightPlayerScore,
    };

    this.connectionGateway.server
      .to(gameRoomId)
      .emit('playerScored', playerScoredDTO);
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
      message.newY - PADDLE_HEIGHT / 2 < 0 ||
      message.newY + PADDLE_HEIGHT / 2 > CANVAS_HEIGHT
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

  private isValidRespondToGameInviteMessage(
    messageBody: any,
  ): messageBody is RespondToGameInviteDTO {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.inviteId === 'number' &&
      typeof messageBody.accepted === 'boolean'
    );
  }

  private isValidSendGameInviteMessage(
    messageBody: any,
  ): messageBody is SendGameInviteDTO {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.recipientUID === 'string'
    );
  }
}

import { Inject, Logger, forwardRef } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GatewayCorsOption } from 'src/common/options/cors.option';
import { PlayerSide } from 'types';
import { ConnectionGateway } from '../connection/connection.gateway';
import { ConnectionService } from '../connection/connection.service';
import { CANVAS_HEIGHT, CANVAS_HEIGHT_OFFSET, GameRoom } from './GameRoom';
import { Player } from './Player';
import { GameEndDTO } from './dto/game-end.dto';
import { GameRoomInfoDTO } from './dto/game-room-info.dto';
import { InvitedToGameDTO } from './dto/invited-to-game.dto';
import { PaddleMoveDTO } from './dto/paddle-move.dto';
import { PlayerReadyDTO } from './dto/player-ready.dto';
import { PlayerScoredDTO } from './dto/player-scored.dto';
import { RespondToGameInviteDTO } from './dto/respond-to-game-invite.dto';
import { SendGameInviteDTO } from './dto/send-game-invite.dto';
import { GameService } from './game.service';

@WebSocketGateway({
  namespace: 'connection',
  cors: GatewayCorsOption,
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

  afterInit(server: Server) {
    this.logger.log('Game-Gateway Initialized');
  }

  /******************************
   *          MESSAGES          *
   ******************************/

  @SubscribeMessage('queueToLadder')
  async queueToLadder(@ConnectedSocket() client: Socket): Promise<void> {
    this.logger.log('Player UID= ' + client.data.userId + ' connected');
    if (this.gameService.isPlayerInQueueOrGame(client.data.userId)) {
      return;
    }

    const newPlayer: Player = new Player(client, client.data.userId);
    await this.gameService.queueToLadder(newPlayer);
  }

  @SubscribeMessage('leaveQueueOrGame')
  async leaveQueueOrGame(@ConnectedSocket() client: Socket): Promise<void> {
    this.logger.log('Player UID= ' + client.data.userId + ' disconnected');
    await this.gameService.disconnectPlayer(client.data.userId);
  }

  @SubscribeMessage('sendGameInvite')
  async sendGameInvite(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: SendGameInviteDTO,
  ): Promise<void> {
    if (!this.isValidSendGameInviteMessage(messageBody)) {
      this.logger.warn(
        'User id=' +
          client.data.userId +
          ' tried to send a wrong SendGameInviteDTO',
      );
      return;
    }

    if (
      this.gameService.isPlayerInQueueOrGame(client.data.userId) ||
      this.gameService.isPlayerInQueueOrGame(parseInt(messageBody.recipientUID))
    ) {
      this.logger.warn(
        'User id=' +
          client.data.userId +
          ' tried to send a game invite while in game or to a recipient in game',
      );
      return;
    }

    const newPlayer: Player = new Player(client, client.data.userId);
    newPlayer.setPlayerSide(PlayerSide.LEFT);

    const inviteId: number = this.gameService.createGameInvite({
      sender: newPlayer,
      recipientUID: messageBody.recipientUID,
    });

    const recipientSocketId: string = this.connectionService.findSocketIdByUID(
      messageBody.recipientUID.toString(),
    );

    const invitedToGame: InvitedToGameDTO = {
      senderUID: client.data.userId,
      inviteId: inviteId,
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
        'User id=' +
          client.data.userId +
          ' tried to send a wrong RespondToGameInviteDTO',
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
        'User id=' +
          client.data.userId +
          ' tried to send a wrong PlayerReadyDTO',
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
        'User id=' +
          client.data.userId +
          ' tried to send a wrong PaddleMoveDTO',
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
      winner: { userId: winner.userId, score: winner.score },
      loser: { userId: loser.userId, score: loser.score },
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

  private isValidSendGameInviteMessage(
    messageBody: any,
  ): messageBody is SendGameInviteDTO {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.recipientUID === 'string'
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

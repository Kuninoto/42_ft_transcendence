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
import { ConnectionGateway } from '../connection/connection.gateway';
import { CANVAS_HEIGHT, CANVAS_HEIGHT_OFFSET, GameRoom } from './GameRoom';
import { Player } from './Player';
import { GameEndDTO } from './dto/game-end.dto';
import { GameRoomInfoDTO } from './dto/game-room-info.dto';
import { PaddleMoveDTO } from './dto/paddle-move.dto';
import { PlayerReadyDTO } from './dto/player-ready.dto';
import { PlayerScoredDTO } from './dto/player-scored.dto';
import { GameService } from './game.service';

@WebSocketGateway({ cors: GatewayCorsOption })
export class GameGateway implements OnGatewayInit {
  constructor(
    @Inject(forwardRef(() => GameService))
    private readonly gameService: GameService,
    private readonly connectionGateway: ConnectionGateway,
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
    this.logger.log('Player connected UID= ' + client.data.userId);
    if (this.gameService.isPlayerInQueueOrGame(client.data.userId)) {
      return;
    }

    const newPlayer: Player = new Player(client, client.data.userId);
    this.gameService.queueToLadder(newPlayer);
  }

  // Listen for 'playerReady' messages
  @SubscribeMessage('playerReady')
  playerReady(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: PlayerReadyDTO,
  ): void {
    if (!this.isValidPlayerReadyMessage(messageBody)) {
      this.logger.error(
        'User id=' +
          client.data.userId +
          ' tried to send a wrong PlayerReadyDTO',
      );
      return;
    }

    this.gameService.playerReady(messageBody.gameRoomId, client.id);
  }

  // Listen for 'paddleMove' messages
  @SubscribeMessage('paddleMove')
  paddleMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: PaddleMoveDTO,
  ): void {
    if (!this.isValidPaddleMoveMessage(messageBody)) {
      this.logger.error(
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

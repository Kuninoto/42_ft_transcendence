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
import { GameRoom, Player } from './game-room';
import { PaddleMoveDTO } from './dto/paddle-move.dto';

@WebSocketGateway({ namespace: 'game-gateway', cors: corsOption })
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  public server: Server;

  private playersInQueueOrGame: Player[];

  constructor(
    private readonly gameService: GameService,
    private readonly authService: AuthService,
  ) {
    this.playersInQueueOrGame = [];
  }

  private readonly logger: Logger = new Logger(GameGateway.name);

  afterInit(server: Server) {
    this.logger.log('Game-gateway Initialized');
  }

  // On socket connection checks if the user is authenticated
  async handleConnection(client: Socket) {
    this.logger.log('Player connected ' + client.id);
    try {
      const userId: number = await this.authService.authenticateClient(client);
      const newPlayer: Player = new Player(client, userId);

      //! TODO
      // Uncomment this, it's just for testing purposes
      // due to testing with only 1 account

      /* if (this.isPlayerInQueueOrGame(newPlayer.userId)) {
        this.logger.error(
          'Duplicate player connecting to game-gateway, disconnecting...',
        );

        // Due to lifecycle hooks, this line calls handleDisconnect();
        // Refer to: https://docs.nestjs.com/websockets/gateways
        client.disconnect();
        return;
      } */

      this.playersInQueueOrGame.push(newPlayer);
      this.gameService.queueToLadder(this.server, newPlayer);
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  async handleDisconnect(client: Socket) {
    this.erasePlayerFromArray(client.id);
    this.gameService.leaveLadderQueue(client.id);
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
    console.debug(this.gameService.getGameRoomInfo(messageBody.gameRoomId));
  }

  broadcastGameRoomInfo(roomId: string): void {
    const gameRoomInfo: GameRoom | undefined =
      this.gameService.getGameRoomInfo(roomId);
    if (gameRoomInfo)
      this.server.to(roomId).emit('game-room-info', gameRoomInfo);
  }

  /* broadcastGameEnd(): void {
    const gameEnd: GameEnd = ;
    this.server.to(gameId).emit('game-end', gameEnd);
  } */

  private erasePlayerFromArray(playerClientId: string): void {
    const indexOfPlayerToDisconnect: number =
      this.playersInQueueOrGame.findIndex((player) => {
        player.client.id === playerClientId;
      });
    if (indexOfPlayerToDisconnect !== -1) {
      this.playersInQueueOrGame.splice(indexOfPlayerToDisconnect, 1);
    }
  }

  private isPlayerInQueueOrGame(newPlayerUID: number): boolean {
    return this.playersInQueueOrGame.some(
      (player) => player.userId === newPlayerUID,
    );
  }
}

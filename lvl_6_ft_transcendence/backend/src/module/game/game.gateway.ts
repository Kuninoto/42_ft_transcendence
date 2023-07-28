import {
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

@WebSocketGateway({ namespace: 'game-gateway', cors: corsOption })
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  public server: Server;

  private playerRooms: Socket[];

  constructor(
    private readonly gameService: GameService,
    private readonly authService: AuthService,
  ) {
    this.playerRooms = [];
  }

  private readonly logger: Logger = new Logger(GameGateway.name);

  afterInit(server: Server) {
    this.logger.log('Game-gateway Initialized');
  }

  // On socket connection checks if the user is authenticated
  async handleConnection(client: Socket) {
    try {
      const userId: number = await this.authService.authenticateClient(client);
      this.gameService.queueToLadder(this.playerRooms, this.server, client, userId);
    } catch (error) {
      this.logger.error(error);
      client.disconnect();
      return;
    }

    this.logger.log('Client connected ' + client.id);
  }

  async handleDisconnect(client: Socket) {
    this.gameService.leaveLadderQueue(client.id);
    this.logger.log('Client disconnected ' + client.id);
  }

  // Listen for 'position-update' events
  /* @SubscribeMessage('position-update')
  positionUpdate(): void {

  } */

  /* broadcastGameData(): void {
    const gameData: GameData = ;
    this.server.to(gameId).emit('game-data', gameData);
  } */

  /* broadcastGameEnd(): void {
    const gameEnd: GameEnd = ;
    this.server.to(gameId).emit('game-end', gameEnd);
  } */
}

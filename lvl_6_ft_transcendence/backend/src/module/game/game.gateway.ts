import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
  WsException,
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

  constructor(
    private readonly gameService: GameService,
    private readonly authService: AuthService,
  ) {}

  private readonly logger: Logger = new Logger(GameGateway.name);

  afterInit(server: Server) {
    this.logger.log('Game-gateway Initialized');
  }

  // On socket connection checks if the user is authenticated
  async handleConnection(client: Socket) {
    const isClientAuth: boolean = await this.authService.isClientAuthenticated(
      client,
    );

    if (!isClientAuth) {
      client.disconnect();
      throw new WsException('Unauthorized');
    }

    this.logger.log('Client connected ' + client.id);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log('Client disconnected ' + client.id);
  }

  // Listen for 'queue-to-ladder' events
  /* @SubscribeMessage('queue-to-ladder')
  queueToLadder(): void {

    // !TODO
    // How's queue gonna work?
    // Simple FIFO?
    // One user joins queue just waiting for another one to also join the queue to be matched?

    const opponent = await this.gameService.queueToLadder();

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

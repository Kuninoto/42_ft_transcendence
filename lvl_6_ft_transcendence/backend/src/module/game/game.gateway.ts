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
import { UserScoredDTO } from './dto/user-scored.dto';
import { GamePlayer } from 'src/common/types/game-player.enum';

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
    this.logger.log('Client connected ' + client.id);
    try {
      const userId: number = await this.authService.authenticateClient(client);
      this.gameService.registerNewClientInfo(client, userId);

      this.gameService.queueToLadder(this.server, client, userId);
    } catch (error) {
      this.logger.error(error.message + ', disconnecting...');
      client.disconnect();
      return;
    }
  }

  async handleDisconnect(client: Socket) {
    this.gameService.leaveLadderQueue(client.id);
    this.logger.log('Client disconnected ' + client.id);
  }

  // Listen for 'position-update' messages
  /* @SubscribeMessage('position-update')
  positionUpdate(): void {

  } */

  // Listen for 'user_scored' messages
  @SubscribeMessage('user_scored')
  async userScored(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: UserScoredDTO,
  ): Promise<void> {
    if (client.data.whichPlayerAmI == GamePlayer.PLAYER_ONE) {
      await this.gameService.playerOneScored(messageBody.gameRoomId);
    } else {
      await this.gameService.playerTwoScored(messageBody.gameRoomId);
    }

    console.log(JSON.stringify(messageBody, null, 2));
  }

  /* broadcastGameData(): void {
    const gameData: GameData = ;
    this.server.to(gameId).emit('game-data', gameData);
  } */

  /* broadcastGameEnd(): void {
    const gameEnd: GameEnd = ;
    this.server.to(gameId).emit('game-end', gameEnd);
  } */
}

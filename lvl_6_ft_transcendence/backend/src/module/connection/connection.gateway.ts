import { Inject, Logger, forwardRef } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GatewayCorsOption } from 'src/common/options/cors.option';
import { UserStatus } from 'src/common/types/user-status.enum';
import { Achievements } from 'src/entity/achievement.entity';
import { User } from 'src/entity/user.entity';
import { AuthService } from 'src/module/auth/auth.service';
import { UsersService } from 'src/module/users/users.service';
import { RoomService } from '../chat/room.service';
import { GameService } from '../game/game.service';
import { NewUserStatusDTO } from './dto/new-user-status.dto';

@WebSocketGateway({
  namespace: 'connection',
  cors: GatewayCorsOption,
})
export class ConnectionGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  public server: Server;

  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly gameService: GameService,
    private readonly roomService: RoomService,
  ) {}

  private readonly logger: Logger = new Logger(ConnectionGateway.name);

  afterInit(server: Server) {
    this.logger.log('Connection-Gateway Initialized');
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const user: User =
        await this.authService.authenticateClientAndRetrieveUser(client);
      client.data.userId = user.id;

      await this.changeUserStatus(user.id, UserStatus.ONLINE);
      this.usersService.updateSocketIdByUID(user.id, client.id);

      this.roomService.joinUserRooms(client);

      this.logger.log('"' + user.name + '" connected to the connection gateway');
    } catch (error) {
      this.logger.warn(error + '. disconnecting...');
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    await this.gameService.disconnectPlayer(client.data.userId);
    await this.changeUserStatus(client.data.userId, UserStatus.OFFLINE);

    this.logger.log('User with id=' + client.data.userId + ' has disconnected');
    this.usersService.updateSocketIdByUID(client.data.userId, null);
  }

  async changeUserStatus(userId: number, newStatus: UserStatus): Promise<void> {
    await this.usersService.updateUserStatusByUID(userId, newStatus);

    // Broadcast new user status to all users connected to the socket
    const newUserStatus: NewUserStatusDTO = {
      uid: userId,
      newStatus: newStatus,
    };
    this.server.emit('newUserStatus', newUserStatus);
  }

  async achievementUnlocked(
    userId: number,
    achievement: Achievements,
  ): Promise<void> {
    const socketId: string = await this.usersService.findSocketIdbyUID(userId);
    this.server
      .to(socketId)
      .emit('achievementUnlocked', { achievement: achievement });
  }
}

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
import { UsersService } from 'src/module/users/users.service';
import { User } from 'src/typeorm';
import { Achievements, Friend, UserStatus } from 'types';
import { RoomService } from '../chat/room.service';
import { FriendshipsService } from '../friendships/friendships.service';
import { GameService } from '../game/game.service';
import { ConnectionService } from './connection.service';
import { AchievementUnlockedDTO } from './dto/achievement-unlocked.dto';
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
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly friendshipsService: FriendshipsService,
    private readonly gameService: GameService,
    private readonly roomService: RoomService,
    private readonly connectionService: ConnectionService,
  ) {}

  private readonly logger: Logger = new Logger(ConnectionGateway.name);

  afterInit(server: Server) {
    this.logger.log('Connection-Gateway Initialized');
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const user: User =
        await this.connectionService.authenticateClientAndRetrieveUser(client);
      client.data.userId = user.id;

      await this.updateUserStatus(user.id, UserStatus.ONLINE);
      this.connectionService.updateSocketIdByUID(user.id.toString(), client.id);

      this.roomService.joinUserRooms(client);

      this.logger.log('"' + user.name + '" connected!');
    } catch (error) {
      this.logger.warn(error + '. Disconnecting...');
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    if (!client.data.userId) return;

    await this.gameService.disconnectPlayer(client.data.userId);
    await this.updateUserStatus(client.data.userId, UserStatus.OFFLINE);

    this.logger.log('User with id=' + client.data.userId + ' has disconnected');
    this.connectionService.deleteSocketIdByUID(client.data.userId);
  }

  async updateUserStatus(userId: number, newStatus: UserStatus): Promise<void> {
    await this.usersService.updateUserStatusByUID(userId, newStatus);

    // Broadcast new user status to all users in the friend room (his friends)
    const newUserStatus: NewUserStatusDTO = {
      uid: userId,
      newStatus: newStatus,
    };
    this.server.to(`friend-${userId}`).emit('newUserStatus', newUserStatus);
  }

  async joinFriendsRooms(client: Socket, userId: number): Promise<void> {
    const friends: Friend[] = await this.friendshipsService.findFriendsByUID(
      userId,
    );

    friends.forEach((friend) => {
      client.join(`friend-${friend.uid}`);
    });
  }

  makeFriendsJoinEachOthersRoom(user1UID: number, user2UID: number): void {
    const user1SocketId: string | undefined =
      this.connectionService.findSocketIdByUID(user1UID.toString());
    const user2SocketId: string | undefined =
      this.connectionService.findSocketIdByUID(user2UID.toString());

    // If both users are online
    if (user1SocketId && user2SocketId) {
      this.server.in(user1SocketId).socketsJoin(`friend-${user2UID}`);
      this.server.in(user2SocketId).socketsJoin(`friend-${user1UID}`);
    }
  }

  async achievementUnlocked(
    userId: number,
    achievement: Achievements,
  ): Promise<void> {
    const socketId: string = this.connectionService.findSocketIdByUID(
      userId.toString(),
    );

    const achievementUnlocked: AchievementUnlockedDTO = {
      achievement: achievement,
    };
    this.server.to(socketId).emit('achievementUnlocked', achievementUnlocked);
  }

  newFriendRequest(receiverUID: number) {
    const receiverSocketId: string | undefined = this.connectionService.findSocketIdByUID(
      receiverUID.toString(),
    );

    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('newFriendRequest');
    }
  }
}

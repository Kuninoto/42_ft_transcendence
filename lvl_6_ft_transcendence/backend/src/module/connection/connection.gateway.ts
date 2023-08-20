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
import { AuthService } from '../auth/auth.service';
import { MessageService } from '../chat/message.service';
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
    private readonly messageService: MessageService,
    private readonly connectionService: ConnectionService,
    private readonly authService: AuthService,
  ) {}

  private readonly logger: Logger = new Logger(ConnectionGateway.name);

  afterInit(server: Server) {
    this.logger.log('Connection-Gateway Initialized');
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      // Throws if there's any misconfig with the access token
      // (bad signature or user doesn't exist)
      const user: User =
        await this.connectionService.authenticateClientAndRetrieveUser(client);

      client.data.userId = user.id;

      await this.updateUserStatus(user.id, UserStatus.ONLINE);

      // Associate the new socket id to the user's UID
      this.connectionService.updateSocketIdByUID(user.id.toString(), client.id);

      this.roomService.joinUserRooms(client);

      this.messageService.sendMissedDirectMessages(client.id, user.id);

      this.logger.log(`${user.name} is online!`);
    } catch (error: any) {
      this.logger.warn(`${error.message}. Disconnecting...`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    if (!client.data.userId) return;

    await this.gameService.disconnectPlayer(client.data.userId);
    await this.updateUserStatus(client.data.userId, UserStatus.OFFLINE);

    this.connectionService.deleteSocketIdByUID(client.data.userId);
    this.authService.logout(client.data.userId);
  
    this.logger.log(`User with uid= ${client.data.userId} is now offline`);
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

  makeFriendsJoinEachOthersRoom(senderUID: number, receiverUID: number): void {
    const senderSocketId: string | undefined =
      this.connectionService.findSocketIdByUID(senderUID.toString());
    const receiverSocketId: string | undefined =
      this.connectionService.findSocketIdByUID(receiverUID.toString());

    // If both users are online
    if (senderSocketId && receiverSocketId) {
      // this.server.to(receiverSocketId).emit('friendRequestAccepted');

      this.server.to(senderSocketId).socketsJoin(`friend-${receiverUID}`);
      this.server.to(receiverSocketId).socketsJoin(`friend-${senderUID}`);
    }
  }

  leaveFriendRooms(senderUID: number, receiverUID: number): void {
    const senderSocketId: string | undefined =
      this.connectionService.findSocketIdByUID(senderUID.toString());
    const receiverSocketId: string | undefined =
      this.connectionService.findSocketIdByUID(receiverUID.toString());

    if (senderSocketId)
      this.server.to(senderSocketId).socketsLeave(`friend-${receiverUID}`);

    if (receiverSocketId)
      this.server.to(receiverSocketId).socketsLeave(`friend-${senderUID}`);
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

  friendRequestReceived(receiverUID: number) {
    const receiverSocketId: string | undefined =
      this.connectionService.findSocketIdByUID(receiverUID.toString());

    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('friendRequestReceived');
    }
  }
}

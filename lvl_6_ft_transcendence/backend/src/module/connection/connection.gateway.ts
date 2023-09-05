import { forwardRef, Inject, Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GatewayCorsOption } from 'src/common/option/cors.option';
import { User } from 'src/entity';
import { UsersService } from 'src/module/users/users.service';
import {
  Friend,
  NewUserStatusEvent,
  RoomInviteReceivedEvent,
  RoomWarningEvent,
  UserStatus,
} from 'types';
import { ChatService } from '../chat/chat.service';
import { FriendshipsService } from '../friendships/friendships.service';
import { GameService } from '../game/game.service';
import { ConnectionService } from './connection.service';

@WebSocketGateway({
  cors: GatewayCorsOption,
  namespace: 'connection',
})
export class ConnectionGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly friendshipsService: FriendshipsService,
    private readonly gameService: GameService,
    private readonly chatService: ChatService,
    private readonly connectionService: ConnectionService,
  ) {}

  private readonly logger: Logger = new Logger(ConnectionGateway.name);

  @WebSocketServer()
  public server: Server;

  afterInit(server: Server) {
    this.logger.log('Connection-Gateway Initialized');
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      // Throws if there's any misconfig with the access token
      // (bad signature, user doesn't exist or isn't part of the whitelist)
      const user: User =
        await this.connectionService.authenticateClientAndRetrieveUser(client);

      client.data.userId = user.id;
      client.data.name = user.name;

      this.connectionService.updateSocketIdByUID(user.id.toString(), client.id);

      await this.updateUserStatus({
        uid: user.id,
        newStatus: UserStatus.ONLINE,
      });

      await this.chatService.joinUserRooms(client);
      await this.joinFriendsRooms(client, user.id),
        await this.chatService.sendMissedDirectMessages(client.id, user.id);

      this.logger.log(`${user.name} is online`);
    } catch (error: any) {
      this.logger.warn(`${error.message}. Disconnecting...`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    if (!client.data.userId) return;

    await this.gameService.disconnectPlayer(client.data.userId);
    this.chatService.disconnectChatter(client.data.userId);
    await this.updateUserStatus({
      uid: client.data.userId,
      newStatus: UserStatus.OFFLINE,
    });

    this.connectionService.deleteSocketIdByUID(client.data.userId);

    this.logger.log(`${client.data.name} is now offline`);
  }

  friendRequestReceived(receiverUID: number) {
    const receiverSocketId: string | undefined =
      this.connectionService.findSocketIdByUID(receiverUID.toString());

    if (receiverSocketId)
      this.server.to(receiverSocketId).emit('friendRequestReceived');
  }

  async joinFriendsRooms(client: Socket, userId: number): Promise<void> {
    const friends: Friend[] = await this.friendshipsService.findFriendsByUID(
      userId,
    );

    const friendRoomNames: string[] = friends.map(
      (friend: Friend): string => 'friend-' + friend.uid,
    );

    client.join(friendRoomNames);
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

  makeFriendsJoinEachOthersRoom(senderUID: number, receiverUID: number): void {
    const senderSocketId: string | undefined =
      this.connectionService.findSocketIdByUID(senderUID.toString());
    const receiverSocketId: string | undefined =
      this.connectionService.findSocketIdByUID(receiverUID.toString());

    // If sender is online
    if (senderSocketId) this.sendRefreshUser(senderUID, senderSocketId);

    // If both users are online
    if (receiverSocketId) {
      this.server.to(senderSocketId).socketsJoin(`friend-${receiverUID}`);
      this.server.to(receiverSocketId).socketsJoin(`friend-${senderUID}`);
    }
  }

  async updateUserStatus(newUserStatus: NewUserStatusEvent): Promise<void> {
    await this.usersService.updateUserStatusByUID(
      newUserStatus.uid,
      newUserStatus.newStatus,
    );

    // Broadcast new user status to all users in the friend room (his friends)
    this.server
      .to(`friend-${newUserStatus.uid}`)
      .emit('newUserStatus', newUserStatus);
  }

  sendAchievementUnlocked(userId: number): void {
    const socketId: string | undefined =
      this.connectionService.findSocketIdByUID(userId.toString());

    // If user is online send the 'notification' that an achievement
    // was unlocked
    if (socketId) this.server.to(socketId).emit('achievementUnlocked');
  }

  sendRefreshUser(userId: number, socketId?: string): void {
    if (!socketId)
      socketId = this.connectionService.findSocketIdByUID(userId.toString());

    if (socketId) this.server.to(socketId).emit('refreshUser');
  }

  sendRoomWarning(roomId: number, warning: RoomWarningEvent): void {
    this.server.to(`room-${roomId}`).emit('roomWarning', warning);
  }

  sendRoomInviteReceived(
    userId: number,
    invite: RoomInviteReceivedEvent,
  ): void {
    const socketId: string | undefined =
      this.connectionService.findSocketIdByUID(userId.toString());

    if (socketId) this.server.to(socketId).emit('roomInviteReceived', invite);
  }
}

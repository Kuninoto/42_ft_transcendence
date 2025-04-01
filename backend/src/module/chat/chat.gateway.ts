import { forwardRef, Inject, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GatewayCorsOption } from 'src/common/option/cors.option';
import { ChatRoom } from 'src/entity';
import { User } from 'src/entity/user.entity';
import { FriendshipsService } from 'src/module/friendships/friendships.service';
import { UsersService } from 'src/module/users/users.service';
import {
  GetChatterRoleEvent,
  GetChatterRoleMessage,
  RoomMessageReceivedEvent,
  SendMessageSMessage,
} from 'types';
import { ConnectionService } from '../connection/connection.service';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: GatewayCorsOption,
  namespace: 'connection',
})
export class ChatGateway implements OnGatewayInit {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly friendshipService: FriendshipsService,
    @Inject(forwardRef(() => ConnectionService))
    private readonly connectionService: ConnectionService,
    private readonly chatService: ChatService,
  ) {}

  private readonly logger: Logger = new Logger(ChatGateway.name);

  afterInit(server: Server) {
    this.logger.log('Chat-Gateway Initialized');
  }

  @SubscribeMessage('sendChatRoomMessage')
  async sendChatRoomMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: SendMessageSMessage,
  ): Promise<void> {
    if (!this.isValidSendMessageSMessage(messageBody)) {
      this.logger.warn(
        `"${client.data.name}" tried to send a wrong SendMessageSMessage`,
      );
      throw new WsException('Wrongly formated message');
    }

    const room: ChatRoom | null = await this.chatService.findRoomById(
      messageBody.receiverId,
    );
    if (!room) {
      this.logger.warn(
        `"${client.data.name}" tried to send a message to a non-existing room`,
      );
      throw new WsException('Room not found');
    }

    const canUserSendMessages: boolean =
      !this.chatService.isUserMuted(client.data.userId, room.id) &&
      !this.chatService.isUserBannedFromRoom(room, client.data.userId) &&
      this.chatService.isUserInRoom(room, client.data.userId);

    if (!canUserSendMessages) {
      this.logger.log(
        `"${client.data.name}" tried to send a message to a room where he's not allowed to (muted, banned or kicked)`,
      );
      return;
    }

    const user: User = await this.usersService.findUserByUID(
      client.data.userId,
    );
    const message: RoomMessageReceivedEvent = {
      id: room.id,
      uniqueId: messageBody.uniqueId,
      author: {
        id: client.data.userId,
        name: user.name,
        avatar_url: user.avatar_url,
      },
      content: messageBody.content,
      sentAt: new Date(),
    };

    const idsOfUsersInRoom: number[] = room.users.map(
      (user: User): number => user.id,
    );
    idsOfUsersInRoom.forEach(async (uid: number): Promise<void> => {
      const blockRelationship: boolean =
        await this.friendshipService.isThereABlockRelationship(
          client.data.userId,
          uid,
        );

      // Retrieve the socketId of the user
      const userSocketId: string | undefined =
        this.connectionService.findSocketIdByUID(uid);
      if (userSocketId && !blockRelationship) {
        client.to(userSocketId).emit('newChatRoomMessage', message);
      }
    });
  }

  @SubscribeMessage('getChatterRole')
  async getChatterRole(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: GetChatterRoleMessage,
  ): Promise<GetChatterRoleEvent> {
    if (!this.isValidGetChatterRoleMessage(messageBody)) {
      this.logger.warn(
        `"${client.data.name}" tried to send a wrong GetChatterRoleMessage`,
      );
      throw new WsException('Wrongly formated message');
    }

    const room: ChatRoom | null = await this.chatService.findRoomById(
      messageBody.roomId,
    );
    if (!room) {
      this.logger.warn(
        `"${client.data.name}" tried to send a message to a non-existing room`,
      );
      throw new WsException('Room not found');
    }

    return {
      myRole: this.chatService.findRoleOnChatRoom(room, client.data.userId),
      authorRole: this.chatService.findRoleOnChatRoom(room, messageBody.uid),
    };
  }

  private isValidSendMessageSMessage(
    messageBody: any,
  ): messageBody is SendMessageSMessage {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.uniqueId === 'string' &&
      typeof messageBody.receiverId === 'number' &&
      typeof messageBody.content === 'string'
    );
  }

  private isValidGetChatterRoleMessage(
    messageBody: any,
  ): messageBody is GetChatterRoleMessage {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.roomId === 'number' &&
      typeof messageBody.uid === 'number'
    );
  }
}

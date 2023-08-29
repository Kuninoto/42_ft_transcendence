import { forwardRef, Inject, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GatewayCorsOption } from 'src/common/option/cors.option';
import { ChatRoom } from 'src/entity';
import { User } from 'src/entity/user.entity';
import { FriendshipsService } from 'src/module/friendships/friendships.service';
import { UsersService } from 'src/module/users/users.service';
import { Chatter } from 'types';
import { ConnectionService } from '../connection/connection.service';
import { ChatService } from './chat.service';
import { RoomMessageReceivedDTO } from './dto/room-message-received.dto';
import { SendMessageDTO } from './dto/send-message.dto';

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
  async onSendChatRoomMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: SendMessageDTO,
  ): Promise<void> {
    if (!this.isValidSendMessageDTO(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong sendChatRoomMessageDTO`,
      );
      return;
    }

    const room: ChatRoom | null = await this.chatService.findRoomById(
      messageBody.receiverId,
    );
    if (!room) {
      this.logger.warn(
        `${client.data.name} tried to send a message to a non-existing room`,
      );
      return;
    }

    const isUserMuted: boolean = await this.chatService.isUserMuted(
      client.data.userId,
      room.id,
    );
    if (isUserMuted) {
      this.logger.log(`${client.data.name} is muted. Message not sent`);
      return;
    }

    const user: User = await this.usersService.findUserByUID(
      client.data.userId,
    );
    const messageAuthor: Chatter = {
      id: client.data.userId,
      name: user.name,
      avatar_url: user.avatar_url,
    };
    const message: RoomMessageReceivedDTO = {
      id: room.id,
      uniqueId: messageBody.uniqueId,
      author: messageAuthor,
      authorRole: this.usersService.findMyRoleOnChatRoom(messageAuthor.id, room),
      content: messageBody.content,
    };

    const idsOfUsersInRoom: number[] = room.users.map((user: User) => user.id);
    idsOfUsersInRoom.forEach(async (uid: number) => {
      const blockRelationship: boolean =
        await this.friendshipService.isThereABlockRelationship(
          client.data.userId,
          uid,
        );

      // Retrieve the clientId of the user
      const userSocketId: string = this.connectionService.findSocketIdByUID(
        uid.toString(),
      );
      if (userSocketId && !blockRelationship) {
        client.to(userSocketId).emit('newChatRoomMessage', message);
      }
    });
  }

  private isValidSendMessageDTO(
    messageBody: any,
  ): messageBody is SendMessageDTO {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.uniqueId === 'string' &&
      typeof messageBody.receiverId === 'number' &&
      typeof messageBody.content === 'string'
    );
  }
}

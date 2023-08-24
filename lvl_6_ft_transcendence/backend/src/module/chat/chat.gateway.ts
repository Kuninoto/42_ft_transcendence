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
import { ChatRoomMessage } from 'types';
import { Author } from 'types/chat/chatter.interface';
import { ConnectionService } from '../connection/connection.service';
import { ChatService } from './chat.service';
import { SendChatRoomMessageDTO } from './dto/send-chatroom-message.dto';

@WebSocketGateway({
  cors: GatewayCorsOption,
  namespace: 'connection',
})
export class ChatGateway implements OnGatewayInit {
  private readonly logger: Logger = new Logger(ChatGateway.name);

  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly friendshipService: FriendshipsService,
    @Inject(forwardRef(() => ConnectionService))
    private readonly connectionService: ConnectionService,
    private readonly chatService: ChatService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Chat-Gateway Initialized');
  }

  @SubscribeMessage('sendChatRoomMessage')
  async onSendChatRoomMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: SendChatRoomMessageDTO,
  ): Promise<void> {
    if (!this.isValidSendChatRoomMessageDTO(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong sendChatRoomMessageDTO`,
      );
      return;
    }

    const room: ChatRoom | null = await this.chatService.findRoomByName(
      messageBody.roomName,
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
    const messageAuthor: Author = {
      id: client.data.userId,
      name: user.name,
      avatar_url: user.avatar_url,
    };
    const message: ChatRoomMessage = {
      author: messageAuthor,
      content: messageBody.text,
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
        client.to(userSocketId).emit('sendChatRoomMessage', message);
      }
    });
  }

  private isValidSendChatRoomMessageDTO(
    messageBody: any,
  ): messageBody is SendChatRoomMessageDTO {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.roomName === 'string' &&
      typeof messageBody.text === 'string'
    );
  }
}

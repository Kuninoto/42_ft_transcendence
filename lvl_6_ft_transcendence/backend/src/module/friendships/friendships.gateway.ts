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
import { DirectMessageReceivedEvent, SendMessageSMessage } from 'types';
import { ChatService } from '../chat/chat.service';
import { ConnectionGateway } from '../connection/connection.gateway';
import { ConnectionService } from '../connection/connection.service';
import { FriendshipsService } from './friendships.service';

@WebSocketGateway({
  cors: GatewayCorsOption,
  namespace: 'connection',
})
export class FriendshipsGateway implements OnGatewayInit {
  constructor(
    @Inject(forwardRef(() => ConnectionGateway))
    private readonly connectionGateway: ConnectionGateway,
    @Inject(forwardRef(() => ConnectionService))
    private readonly connectionService: ConnectionService,
    private readonly friendshipService: FriendshipsService,
    private readonly chatService: ChatService,
  ) {}

  private readonly logger: Logger = new Logger(FriendshipsGateway.name);

  afterInit(server: Server) {
    this.logger.log('Friendships-Gateway Initialized');
  }

  /******************************
   *          MESSAGES          *
   ******************************/

  @SubscribeMessage('sendDirectMessage')
  async sendDirectMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: SendMessageSMessage,
  ): Promise<void> {
    if (!this.isValidSendMessageSMessage(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong SendMessageSMessage`,
      );
      throw new WsException('Wrongly formated message');
    }

    if (client.data.userId == messageBody.receiverId) {
      // self message
      throw new WsException('Cannot self message');
    }

    const areTheyFriends: boolean = await this.friendshipService.areTheyFriends(
      client.data.userId,
      messageBody.receiverId,
    );

    if (!areTheyFriends)
      throw new WsException("You're only allowed to DM your friends");

    const receiverSocketId: string | undefined =
      this.connectionService.findSocketIdByUID(messageBody.receiverId);

    const directMessageReceived: DirectMessageReceivedEvent = {
      uniqueId: messageBody.uniqueId,
      author: await this.chatService.findChatterInfoByUID(client.data.userId),
      content: messageBody.content,
    };

    if (!receiverSocketId) {
      // If user is offline save DM on database
      // to later send when he comes back online
      await this.chatService.createDirectMessage(
        client.data.userId,
        messageBody.receiverId,
        messageBody.uniqueId,
        messageBody.content,
      );
    } else {
      this.connectionGateway.server
        .to(receiverSocketId)
        .emit('directMessageReceived', directMessageReceived);
    }
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
}

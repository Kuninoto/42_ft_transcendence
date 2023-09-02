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
import { SendMessageRequest } from 'types';
import { DirectMessageReceivedResponse } from 'types/friendship/socket';
import { ChatService } from '../chat/chat.service';
import { ConnectionGateway } from '../connection/connection.gateway';
import { ConnectionService } from '../connection/connection.service';
import { FriendshipsService } from './friendships.service';

@WebSocketGateway({
  cors: GatewayCorsOption,
  namespace: 'connection',
})
export class FriendshipsGateway implements OnGatewayInit {
  private readonly logger: Logger = new Logger(FriendshipsGateway.name);

  constructor(
    @Inject(forwardRef(() => ConnectionGateway))
    private readonly connectionGateway: ConnectionGateway,
    @Inject(forwardRef(() => ConnectionService))
    private readonly connectionService: ConnectionService,
    private readonly friendshipService: FriendshipsService,
    private readonly chatService: ChatService,
  ) {}

  /******************************
   *          MESSAGES          *
   ******************************/

  afterInit(server: Server) {
    this.logger.log('Friendships-Gateway Initialized');
  }

  @SubscribeMessage('sendDirectMessage')
  async sendDirectMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: SendMessageRequest,
  ): Promise<void> {
    if (!this.isValidSendMessageRequest(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong SendMessageRequest`,
      );
      return;
    }

    if (client.data.userId == messageBody.receiverId) {
      // self message
      return;
    }

    const areTheyFriends: boolean = await this.friendshipService.areTheyFriends(
      client.data.userId,
      messageBody.receiverId,
    );

    if (!areTheyFriends) {
      // Only able to send messages to friends
      return;
    }

    const receiverSocketId: string | undefined =
      this.connectionService.findSocketIdByUID(
        messageBody.receiverId.toString(),
      );

    const directMessageReceived: DirectMessageReceivedResponse = {
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

  private isValidSendMessageRequest(
    messageBody: any,
  ): messageBody is SendMessageRequest {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.uniqueId === 'string' &&
      typeof messageBody.receiverId === 'number' &&
      typeof messageBody.content === 'string'
    );
  }
}

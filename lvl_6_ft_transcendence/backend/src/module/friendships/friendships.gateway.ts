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
import { ChatService } from '../chat/chat.service';
import { ConnectionGateway } from '../connection/connection.gateway';
import { ConnectionService } from '../connection/connection.service';
import { DirectMessageReceivedDTO } from './dto/direct-message-received.dto';
import { SendDirectMessageDTO } from './dto/send-direct-message.dto';
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
    @MessageBody() messageBody: SendDirectMessageDTO,
  ): Promise<void> {
    if (!this.isValidSendDirectMessageDTO(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong SendDirectMessageDTO`,
      );
      return;
    }

    if (client.data.userId == messageBody.receiverUID) {
      // self message
      return;
    }

    const areTheyFriends: boolean = await this.friendshipService.areTheyFriends(
      client.data.userId,
      messageBody.receiverUID,
    );

    if (!areTheyFriends) {
      // Only able to send messages to friends
      return;
    }

    const receiverSocketId: string | undefined =
      this.connectionService.findSocketIdByUID(
        messageBody.receiverUID.toString(),
      );

    const directMessageReceived: DirectMessageReceivedDTO = {
      uniqueId: messageBody.uniqueId,
      author: await this.chatService.findChatterInfoByUID(client.data.userId),
      content: messageBody.content,
    };

    if (!receiverSocketId) {
      // If user is offline save DM on database
      // to later send when he comes back online
      await this.chatService.createDirectMessage(
        client.data.userId,
        messageBody.receiverUID,
        messageBody.uniqueId,
        messageBody.content,
      );
    } else {
      this.connectionGateway.server
        .to(receiverSocketId)
        .emit('directMessageReceived', directMessageReceived);
    }
  }

  private isValidSendDirectMessageDTO(
    messageBody: any,
  ): messageBody is SendDirectMessageDTO {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.uniqueId === 'string' &&
      typeof messageBody.receiverUID === 'number' &&
      typeof messageBody.content === 'string'
    );
  }
}

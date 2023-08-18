import { Inject, Logger, forwardRef } from '@nestjs/common';
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GatewayCorsOption } from 'src/common/options/cors.option';
import { ConnectionGateway } from '../connection/connection.gateway';
import { DirectMessageReceivedDTO } from './dto/direct-message-received.dto';
import { SendDirectMessageDTO } from './dto/send-direct-message.dto';
import { ConnectionService } from '../connection/connection.service';
import { MessageService } from '../chat/message.service';

@WebSocketGateway({
	namespace: 'connection',
	cors: GatewayCorsOption,
})
export class FriendshipsGateway implements OnGatewayInit {
	constructor(
		@Inject(forwardRef(() => ConnectionGateway))
		private readonly connectionGateway: ConnectionGateway,
		@Inject(forwardRef(() => ConnectionService))
		private readonly connectionService: ConnectionService,
		private readonly messageService: MessageService,
	) { }

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
		@MessageBody() messageBody: SendDirectMessageDTO,
	): Promise<void> {
		if (!this.isValidSendDirectMessageDTO(messageBody)) {
			this.logger.warn(
				'Client with uid=' +
				client.data.userId +
				' tried to send a wrong SendDirectMessageDTO',
			);
			return;
		}

		const receiverSocketId: string | undefined =
			this.connectionService.findSocketIdByUID(messageBody.receiverUID);

		// Save DM on database
		await this.messageService.createDirectMessage(
			client.data.userId,
			messageBody.receiverUID,
			messageBody.content,
		);

		const directMessageReceived: DirectMessageReceivedDTO = {
			senderUID: client.data.userId,
			content: messageBody.content,
		};

		// Don't send message if user is offline
		if (receiverSocketId) {
			this.connectionGateway.server
				.to(receiverSocketId)
				.emit('directMessageReceived', directMessageReceived);
		}
	}

	/******************************
	 *           EVENTS           *
	 ******************************/

	private isValidSendDirectMessageDTO(
		messageBody: any,
	): messageBody is SendDirectMessageDTO {
		return (
			typeof messageBody === 'object' &&
			typeof messageBody.receiverUID === 'number' &&
			typeof messageBody.content === 'string'
		);
	}
}

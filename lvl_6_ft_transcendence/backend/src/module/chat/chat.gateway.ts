import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { MessageDto } from './dto/message.dto';
import { Server, Socket } from 'socket.io';

// ! the first number defines the socket PORT
// Cross-Origin Resource Sharing (CORS) configures the behavior for the WebSocket gateway.
// origin option defines who can connect to the socket. (i.e., domain or IP address)
// In this case any origin is allowed
@WebSocketGateway(
	3001,
	{
	cors: {
		origin: '*',
	},
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	// Check for connection and print the socket id
	handleConnection(client: any) {
		console.log(client.id);
		console.log('Connected');
	}

	// Check for disconnection and print the socket id
	handleDisconnect(client: any) {
		console.log(client.id);
		console.log('Disconnected');
	}

	constructor(private readonly chatService: ChatService) {}

	// When recwiving a message create it in the database and emit to everyone
	@SubscribeMessage('newMessage')
	async create(@MessageBody() MessageDto: MessageDto) {
		console.log(MessageDto);

		const message = await this.chatService.createMessage(MessageDto);

		this.server.emit('onMessage', message.text);
	}

	@SubscribeMessage('findAllMessages')
	findAll() {
		return this.chatService.findAll();
	}

}

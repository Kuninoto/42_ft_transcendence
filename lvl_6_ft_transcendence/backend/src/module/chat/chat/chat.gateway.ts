import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { MessageDto } from './dto/message.dto';
import { Server, Socket } from 'socket.io';
import { UserI } from 'src/entity/user.interface';
import { RoomService } from '../room/room/room.service'
import { UsersService } from 'src/module/users/service/users.service';
import { AuthService } from 'src/module/auth/service/auth.service';
import { Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/module/auth/guard/jwt-auth.guard';
import { RoomI } from '../entities/room.interface';
import { RoomDto } from './dto/room.dto';

// ! the first number defines the socket PORT
// Cross-Origin Resource Sharing (CORS) configures the behavior for the WebSocket gateway.
// origin option defines who can connect to the socket. (i.e., domain or IP address)
// In this case any origin is allowed
@WebSocketGateway(
	{
	cors: {
		origin: '*',
	},
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	constructor(private chatService: ChatService, private authService: AuthService, private roomService: RoomService, private userService: UsersService) {}

	@UseGuards(JwtAuthGuard)
	// Check for connection and print the socket id
	async handleConnection(socket: Socket, @Req() req: any) {
		// console.log('Connecting ' + req.user);
		// TODO use auth module to do verification
		// check if user already exists
		// try {
		// 	const user: UserI = await this.userService.findUserById(req.user.id);
		// 	if (!user) {
		// 		console.log('No user');
		// 		return this.disconnect(socket);
		// 	} else {
		// 		console.log('Connect Sucessful');
		// 		socket.data.user = user;
		// 		const rooms = await this.roomService.getRoomsForUser(user.id, {page: 1, limit: 10});

		// 		// Only emit rooms to the specific connected client
		// 		return this.server.to(socket.id).emit('rooms', rooms);
		// 	}
		// } catch {
		// 	console.log('Error on user auth');
		// 	return this.disconnect(socket);
		// }

	}

	// Check for disconnection and print the socket id
	handleDisconnect(socket: Socket) {
	}

	private disconnect(socket: Socket) {
		console.log('Disconnecting user');
		socket.emit('Error', new UnauthorizedException());
		socket.disconnect();
	}

	@SubscribeMessage('createRoom')
	async onCreateRoom(socket: Socket, room: RoomDto): Promise<RoomDto> {
		// TODO verify room users after creation
		// TODO delete console.logs and verify if current user is working
		console.log('user: ' + socket.data.user);
		console.log('room name: ' + room.name);
		console.log('room owner: ' + room.owner);
		return this.roomService.createRoom(room/*, socket.data.user*/);
	}

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

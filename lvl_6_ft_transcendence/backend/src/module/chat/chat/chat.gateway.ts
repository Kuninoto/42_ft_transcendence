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
import { User } from 'src/entity/user.entity';
import { Logger } from '@nestjs/common'

// ! the first number defines the socket PORT
// Cross-Origin Resource Sharing (CORS) configures the behavior for the WebSocket gateway.
// origin option defines who can connect to the socket. (i.e., domain or IP address)
// In this case any origin is allowed
@WebSocketGateway({
	namespace: '/chat',
	cors: {
		origin: '*',
	},
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer() server: Server;

	constructor(private chatService: ChatService, private authService: AuthService, private roomService: RoomService, private userService: UsersService) {}

	// Check for connection and print the socket id
	async handleConnection(socket: Socket) {
		// Check user token
		try {
			Logger.debug('Starting token verification');
			const token = socket.handshake.headers.authorization;

			// throws if the token is not valid
			const decoded = await this.authService.verifyJwt(token);
			
			Logger.debug('Trying to find user');
			// make sure user exists
			const user: User = await this.userService.findUserById(decoded[1]);
			
			Logger.debug('User found!');
			if (user) {
				socket.data.user = user;
			} else {
				throw new Error('error with user');
			}
		}
		catch {
			return this.disconnect(socket);
		}
		Logger.log(socket.data.user.name + ' connected to the chat socket');
	}

	// Check for disconnection and print the socket id
	handleDisconnect(socket: Socket) {
	}

	private disconnect(socket: Socket) {
		Logger.log('Disconnecting');
		socket.emit('Error', new UnauthorizedException());
		socket.disconnect();
	}

	@SubscribeMessage('createRoom')
	async onCreateRoom(socket: Socket, room: RoomI): Promise<RoomI> {
		// TODO verify room users after creation
		// TODO delete Logger.logs and verify if current user is working
		Logger.debug('------------ Creating room ------------');
		Logger.debug('user: ' + JSON.stringify(socket.data.user, null, 2));
		Logger.debug('room name: ' + room.name);
		Logger.debug('room owner: ' + room.owner);
		Logger.debug('---------------------------------------');
		return this.roomService.createRoom(room, socket.data.user);
	}

	@SubscribeMessage('joinRoom')
	async onJoinRoom(socket: Socket, roomName: string) {
		// TODO
		Logger.log('------------ Joining room ------------');
		Logger.log('user: ' + JSON.stringify(socket.data.user, null, 2));
		Logger.log('room name: ' + roomName);
		Logger.log('--------------------------------------');
		const room = this.roomService.joinRoom(roomName, socket.data.user);
		const userName = socket.data.user

		if (room) {
			socket.join((await room).name);
			this.server.to((await room).name).emit('joinedRoom', {roomName, userName})
		} else {
			Logger.log('The room with "' + roomName + '" name doesn\'t exist');
		}
	}

	// When recwiving a message create it in the database and emit to everyone
	@SubscribeMessage('newMessage')
	async create(@MessageBody() MessageDto: MessageDto) {
		Logger.log(MessageDto);

		const message = await this.chatService.createMessage(MessageDto);

		this.server.emit('onMessage', message.text);
	}

	@SubscribeMessage('findAllMessages')
	findAll() {
		return this.chatService.findAllMessages();
	}

}

import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { ChatService } from './../service/chat.service';
import { MessageDto } from '../../message/entity/message.dto';
import { Server, Socket } from 'socket.io';
import { UserI } from 'src/entity/user.interface';
import { RoomService } from '../../room/service/room.service'
import { UsersService } from 'src/module/users/users.service';
import { AuthService } from 'src/module/auth/auth.service';
import { UnauthorizedException} from '@nestjs/common';
import { RoomI } from '../../room/entity/room.interface';
import { User } from 'src/entity/user.entity';
import { Logger } from '@nestjs/common'
import { MessageService } from '../../message/service/message.service';

// The first number defines the socket PORT
// Cross-Origin Resource Sharing (CORS) configures the behavior for the WebSocket gateway.
// origin option defines who can connect to the socket. (i.e., domain or IP address)
// In this case any origin is allowed
// namespace is the url path. ex localhost:5000/chat
@WebSocketGateway({
	namespace: 'chat',
	cors: {
		origin: '*',
	},
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer() server: Server;

	constructor(private messageService: MessageService, private authService: AuthService, private roomService: RoomService, private userService: UsersService) {}

	// Check for connection and print the socket id
	async handleConnection(socket: Socket) {
		// Check user token
		// TODO remove Logger.debug
		try {
			const user: User = await this.authService.authenticateClientAndRetrieveUser(socket)

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

	// TODO Check for disconnection and print the socket id
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
		// TODO delete Logger.debug and verify if current user is working
		Logger.debug('------------ Creating room ------------');
		console.debug('room name: ' + room.name);
		console.debug('room owner: ' + room.owner);
		Logger.debug('---------------------------------------');
		return this.roomService.createRoom(room, socket.data.user);
	}

	@SubscribeMessage('joinRoom')
	async onJoinRoom(socket: Socket, roomName: string) {
		// TODO delete Logger.debug
		Logger.debug('------------ Joining room ------------');
		console.debug('room name: ' + roomName);
		Logger.debug('--------------------------------------');
		const room = await this.roomService.joinRoom(roomName, socket.data.user);
		const userName = socket.data.user

		if (room) {
			socket.join(room.name);
			this.server.to(room.name).emit('joinedRoom', {roomName, userName})
		} else {
			Logger.log('The room with "' + roomName + '" name doesn\'t exist');
		}
	}

	//TODO test this shit!
	// When recwiving a message create it in the database and emit to everyone
	@SubscribeMessage('newMessage')
	async create(@MessageBody() MessageDto: MessageDto, socket: Socket) {
		const room = await this.roomService.findRoomByName(MessageDto.room.name);

		Logger.debug('------------ Create Message ------------');
		console.log('MessageDto:' + MessageDto);
		console.log('Room: ' + JSON.stringify(room, null, 2));
		console.log('User name: ' + socket.data.user.name);
		Logger.debug('----------------------------------------');

		if (room) {
			MessageDto.user = socket.data.user;
			MessageDto.room = room;
			const message = await this.messageService.createMessage(MessageDto);
			this.server.to(room.name).emit('onMessage', message.text);
		} else {
			// TODO implement error response
			Logger.debug('Gateway[newMessage]: room not found');
			throw new Error('Room not found');
		}
	}

	@SubscribeMessage('findAllMessages')
	findAll() {
		return this.messageService.findAllMessages();
	}

}

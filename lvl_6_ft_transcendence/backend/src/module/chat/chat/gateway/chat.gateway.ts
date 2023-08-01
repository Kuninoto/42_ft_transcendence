import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket } from '@nestjs/websockets';
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
import { ChatRoom } from '../../room/entity/chatRoom.entity';
import { Message } from '../../message/entity/message.entity';

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
	@WebSocketServer() public server: Server;

	constructor(private messageService: MessageService, private authService: AuthService, private roomService: RoomService, private userService: UsersService) {}

	afterInit(server: Server) {
		Logger.log('Game-gateway Initialized');
	}

	// Check for connection and print the socket id
	async handleConnection(socket: Socket) {
		// Check user token
		// TODO remove Logger.debug
		try {
			// const user: User = await this.authService.authenticateClientAndRetrieveUser(socket);
			const user: User = await this.userService.findUserByUID(Number(socket.handshake.headers.authorization));

			// TODO delete debugging when not needed
			Logger.debug('Gateway.onConnect[Socket]: ' + socket.handshake.headers.authorization);
			Logger.debug('Gateway.onConnect[User]: ' + user.name);

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
		Logger.log('Disconnected');
		socket.emit('Error', new UnauthorizedException());
		socket.disconnect();
	}

	@SubscribeMessage('createRoom')
	async onCreateRoom(@ConnectedSocket() socket: Socket, @MessageBody() room: RoomI): Promise<RoomI> {
		// TODO verify room users after creation
		// TODO delete Logger.debug and verify if current user is working
		Logger.debug('------------ Creating room ------------');
		Logger.debug('User name: ' + socket.data.user.name);
		Logger.debug('room name: ' + room.name);
		Logger.debug('room owner: ' + room.owner);
		Logger.debug('---------------------------------------');
		socket.join(room.name);
		return this.roomService.createRoom(room, socket.data.user);
	}

	@SubscribeMessage('joinRoom')
	async onJoinRoom(@ConnectedSocket() socket: Socket, @MessageBody() roomName: string) {
		// TODO delete Logger.debug
		// TODO verify if user is already in room
		Logger.debug('------------ Joining room ------------');
		Logger.debug('User name: ' + socket.data.user.name);
		Logger.debug('room name: ' + roomName);
		Logger.debug('--------------------------------------');
		const room: ChatRoom = await this.roomService.joinRoom(roomName, socket.data.user);
		const userName: string = socket.data.user.name

		if (room) {
			socket.join(room.name);
			socket.to(room.name).emit('joinedRoom', {roomName, userName})
		} else {
			Logger.log('The room with "' + roomName + '" name doesn\'t exist');
		}
	}

	//TODO fix this shit! Not receiving message on room.
	// When recwiving a message create it in the database and emit to everyone
	@SubscribeMessage('newMessage')
	async onMessage(@ConnectedSocket() socket: Socket, @MessageBody() MessageDto: MessageDto) {
		const room = await this.roomService.findRoomByName(MessageDto.room.name);

		// TODO delete debug
		Logger.debug('------------ Create Message ------------');
		Logger.debug('MessageDto:' + MessageDto);
		Logger.debug('Room: ' + JSON.stringify(room, null, 2));
		Logger.debug('User name: ' + socket.data.user.name);
		Logger.debug('----------------------------------------');

		if (room) {
			MessageDto.user = socket.data.user;
			MessageDto.room = room;
			const message: Message = await this.messageService.createMessage(MessageDto);
			Logger.debug('Gateway.newMessage[text]: ' + message.text);
			Logger.debug('Gateway.newMessage[room]: ' + room.name);
			Logger.debug('Gateway.newMessage[socket]: ' + socket.id);
			socket.to(room.name).emit('onMessage', message.text);
		} else {
			// TODO implement error response
			Logger.debug('Gateway.newMessage[error]: error when sending text');
			throw new Error('Room not found');
		}
	}

	// TODO this is a debug function. Delete it at the end
	@SubscribeMessage('test')
	async test(@ConnectedSocket() socket: Socket){

		Logger.debug('\t\t\t\t!!!!Debug mode activated!!!!\t\t\t\t');
		Logger.debug('Current User: ' + socket.data.user.name);
		Logger.debug('Socket Id: ' + socket.id);
		socket.to('test').emit('onMessage', 'Test message. BEFORE joining room! Did you receive it?');
		Logger.debug('Room: ' + JSON.stringify(socket.rooms, null, 2));
		socket.join('test');
		socket.to('test').emit('onMessage', 'Test message. INSIDE the room! Did you receive it?');
		Logger.debug('Room: ' + JSON.stringify(socket.rooms, null, 2));
		socket.leave('test');
		socket.to('test').emit('onMessage', 'Test message. AFTER leaving room! Did you receive it?');
		Logger.debug('Room: ' + JSON.stringify(socket.rooms, null, 2));
		Logger.debug('\t\t\t\t!!!!Debug mode deactivated!!!!\t\t\t\t');

	}

	@SubscribeMessage('findAllMessages')
	findAll() {
		return this.messageService.findAllMessages();
	}

}

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
import { FriendshipsService } from 'src/module/friendships/friendships.service';
import { BlockedUserInterface } from 'src/common/types/blocked-user-interface.interface';

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

	constructor(
		private messageService: MessageService, 
		private authService: AuthService, 
		private roomService: RoomService, 
		private userService: UsersService, 
		private friendshipService: FriendshipsService
	) {}

	afterInit(server: Server) {
		Logger.log('Chat-gateway Initialized');
	}

	// Check for connection and print the socket id
	async handleConnection(socket: Socket) {
		// Check user token
		// TODO remove Logger.debug
		try {
			// const user: User = await this.authService.authenticateClientAndRetrieveUser(socket);
			const user: User = await this.userService.findUserByUID(Number(socket.handshake.headers.authorization));
			this.userService.updateUserSocketIdByUID(user.id, socket.id);

			this.roomService.joinUserRooms(socket, await this.roomService.findUserRooms(user.id));

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
			return socket.disconnect();
		}
		Logger.log(socket.data.user.name + ' connected to the chat socket');
	}

	// TODO Check for disconnection and print the socket id
	handleDisconnect(socket: Socket) {
		if (!socket.data.user) {
			Logger.log('Undefined intruder has disconnected');
		}
		else {
			Logger.log(socket.data.user.name + ' has disconnected');
			this.userService.updateUserSocketIdByUID(socket.data.user.id, null);
		}
	}
	
	/* private disconnect(socket: Socket) {
		socket.emit('Error', new UnauthorizedException());
		socket.disconnect();
	} */

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
		
		if (room) {
			MessageDto.user = socket.data.user;
			MessageDto.room = room;
			const message: Message = await this.messageService.createMessage(MessageDto);
			
			const usersInRoom: number[] = room.users.map(user => user.id);
			
			usersInRoom.forEach(async uid => {
				console.log(uid);
				const blockRelationship: boolean = await this.friendshipService.isThereABlockRelationship(socket.data.user, uid);
				Logger.debug(blockRelationship);
				const userSocket: string = await this.userService.findSocketIDbyUID(uid); // Retrieve the socket of the user
				Logger.debug('Socket id: ' + userSocket);
				Logger.debug('User: ' + JSON.stringify(message.user , null, 2 ));

				if (userSocket && !blockRelationship) {
					socket.to(userSocket).emit('onMessage', message.text);
				}

				// TODO delete debug
				Logger.debug(socket.data.user.name + '[' + room.name + ']: ' + message.text);
			});
		} else {
			// TODO implement error response
			Logger.debug('Gateway.newMessage[error]: error when sending text');
			throw new Error('Room not found');
		}
	}

	@SubscribeMessage('findAllMessages')
	findAll() {
		return this.messageService.findAllMessages();
	}

}

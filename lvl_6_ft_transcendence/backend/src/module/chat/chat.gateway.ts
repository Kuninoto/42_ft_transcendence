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
import { ChatRoomMessageI } from 'src/common/types/chat-room-message.interface';
import { DirectMessageI } from 'src/common/types/direct-message.interface';
import { User } from 'src/entity/user.entity';
import { FriendshipsService } from 'src/module/friendships/friendships.service';
import { UsersService } from 'src/module/users/users.service';
import { ChatRoom } from 'src/typeorm';
import { ConnectionGateway } from '../connection/connection.gateway';
import { ConnectionService } from '../connection/connection.service';
import { CreateRoomDTO } from './dto/create-room.dto';
import { InviteToRoomDTO } from './dto/invite-to-room.dto';
import { JoinRoomDTO } from './dto/join-room.dto';
import { NewChatRoomMessageDTO } from './dto/new-chatroom-message.dto';
import { OnDirectMessageDTO } from './dto/on-direct-message.dto';
import { MessageService } from './message.service';
import { RoomService } from './room.service';
import { KickFromRoomDTO } from './dto/kick-from-room.dto';
import { AddAdminDTO } from './dto/add-admin.dto';
import { BanFromRoomDTO } from './dto/ban-from-room.dto';
import { MuteUserDTO } from './dto/mute-user.dto';

@WebSocketGateway({
	namespace: 'connection',
	cors: GatewayCorsOption,
})
export class ChatGateway implements OnGatewayInit {
	constructor(
		@Inject(forwardRef(() => UsersService))
		private readonly usersService: UsersService,
		private readonly friendshipService: FriendshipsService,
		private readonly roomService: RoomService,
		private readonly messageService: MessageService,
		@Inject(forwardRef(() => ConnectionGateway))
		private readonly connectionGateway: ConnectionGateway,
		@Inject(forwardRef(() => ConnectionService))
		private readonly connectionService: ConnectionService,
	) {}

	private readonly logger: Logger = new Logger(ChatGateway.name);

	afterInit(server: Server) {
		this.logger.log('Chat-Gateway Initialized');
	}

	/******************************
	 *          MESSAGES          *
	 ******************************/

	@SubscribeMessage('createRoom')
	async onCreateRoom(
		@ConnectedSocket() client: Socket,
		@MessageBody() messageBody: CreateRoomDTO,
	): Promise<void> {
		if (await this.roomService.findRoomByName(messageBody.name)) {
		// Room name is already taken
		return;
		}

		this.roomService.createRoom(messageBody, await this.usersService.findUserByUID(client.data.userId));
		client.join(messageBody.name);
	}

	@SubscribeMessage('joinRoom')
	async onJoinRoom(
		@ConnectedSocket() client: Socket,
		@MessageBody() messageBody: JoinRoomDTO,
	) {
		if (!this.isValidJoinRoomDTO(messageBody)) {
			this.logger.warn(
				'Client with client id=' + client.id + ' tried to send a wrong JoinRoomDTO'
			);
			return;
		}

		const room: ChatRoom = await this.roomService.findRoomByName(messageBody.name)
		if (!room) {
			this.logger.log('A room with "' + messageBody.name + '" name doesn\'t exist');
			return;
		}

		if (await this.roomService.checkIfUserBannedFromRoom(room, client.data.userId)) {
			this.logger.log('User with id: ' + client.data.userId + ' is banned from' + messageBody.name);
			return;
		}

		const user: User = await this.usersService.findUserByUID(client.data.userId);
		if (!room) {
			this.logger.warn(
				'Someone is trying to get into a chat room without being a user\nSocket id: ' 
				+ client.id + '\nUser id: ' + client.data.userId
				);
			return ;
		}
		const username: string | undefined = user.name;

		this.roomService.joinRoom(room, user);
		client.join(messageBody.name);
		client.to(messageBody.name).emit('joinedRoom', { username });
	}

	@SubscribeMessage('addAdmin')
	public async onAddAdmin(
		@ConnectedSocket() client: Socket,
		@MessageBody() messageBody: AddAdminDTO,
		){

		this.logger.debug('RoomID: ' + messageBody.roomId);
		this.logger.debug('UserID: ' + messageBody.userId);

		const room: ChatRoom = await this.roomService.findRoomById(messageBody.roomId);
		this.logger.debug('room: ' + JSON.stringify(room, null, 2))
		if (!room) {
			this.logger.warn('"' + messageBody.roomId + '" there\'s no room with that ID');
			return ;
		}

		if (!await this.roomService.checkIfUserIsAdmin(room, client.data.userId)) {
			this.logger.warn(
				'User with the id: ' + messageBody.userId + 'is not an admin on room: ' + room.name
				);
			return ;
		}

		this.roomService.addUserAsAdmin(room, messageBody.userId);
	}

	@SubscribeMessage('kickFromRoom')
	async onKickFromRoom(
		@ConnectedSocket() client: Socket,
		@MessageBody() messageBody: KickFromRoomDTO,
	): Promise<void> {
		const room: ChatRoom | null = await this.roomService.findRoomById(messageBody.roomId);
		if (!room) {
			this.logger.warn('Room doesn\'t exist');
			return;
		}

		if (!await this.roomService.checkIfUserIsAdmin(room, client.data.userId)) {
			this.logger.warn(
				'User with the id: ' + client.data.userId + 'is not an admin on room: ' + room.name
				);
			return ;
		}

		this.roomService.leaveRoom(room, messageBody.userId);
		client.leave(room.name);
		this.logger.debug('User with id: ' + messageBody.userId + ' kicked from ' + room.name);
	}

	@SubscribeMessage('banFromRoom')
	async onBanFromRoom(
		@ConnectedSocket() client: Socket,
		@MessageBody() messageBody: BanFromRoomDTO,
	): Promise<void> {
		const room: ChatRoom | null = await this.roomService.findRoomById(messageBody.roomId);
		if (!room) {
			this.logger.warn('Room doesn\'t exist');
			return;
		}

		if (!await this.roomService.checkIfUserIsAdmin(room, client.data.userId)) {
			this.logger.warn(
				'User with the id: ' + client.data.userId + 'is not an admin on room: ' + room.name
				);
			return ;
		}

		this.roomService.leaveRoom(room, messageBody.userId);
		this.roomService.banRoom(room, messageBody.userId);
		client.leave(room.name);
		this.logger.debug('User with id: ' + messageBody.userId + ' banned from ' + room.name);
	}

	@SubscribeMessage('muteUser')
	async muteUser(
		@ConnectedSocket() client: Socket,
		@MessageBody() messageBody: MuteUserDTO,
	): Promise<void> {
		const room: ChatRoom | null = await this.roomService.findRoomById(messageBody.roomId);
		if (!room) {
			this.logger.warn('Room doesn\'t exist');
			return;
		}

		if (!await this.roomService.checkIfUserIsAdmin(room, client.data.userId)) {
			this.logger.warn(
				'User with the id: ' + client.data.userId + 'is not an admin on room: ' + room.name
				);
			return ;
		}

		const user = await this.usersService.findUserByUID(messageBody.userId);
		if (!user) {
			this.logger.debug('User with id: ' + messageBody.userId + 'doesn\'t exist');
			return ;
		}

		// Calculate the time duration in milliseconds
		let muteDuration = 0;
		if (messageBody.duration === '30m') {
			muteDuration = 30 * 60 * 1000; // 30 minutes
		} else if (messageBody.duration === '1h') {
			muteDuration = 60 * 60 * 1000; // 1 hour
		} else if (messageBody.duration === '2h') {
			muteDuration = 2 * 60 * 60 * 1000; // 2 hours
		}

		this.roomService.muteUser(messageBody.userId, muteDuration, room);
		this.logger.debug(user.name + ' was muted on ' + room.name);
	}

	@SubscribeMessage('inviteToRoom')
	async onInviteToRoom(
		@ConnectedSocket() socket: Socket,
		@MessageBody() messageBody: InviteToRoomDTO,
	): Promise<void> {
		if (!this.isValidInviteToRoomDTO(messageBody)) {
			this.logger.warn(
				'Client with socket id=' +
					socket.id +
					' tried to send a wrong InviteToRoomDTO',
			);
			return;
		}

		const invited: User | null = await this.usersService.findUserByUID(
			messageBody.invitedUID,
		);
		if (!invited) {
			// TODO
			// user doesn't exist
			return;
		}

		const invitedSocketId: string = this.connectionService.findSocketIdByUID(
			invited.id,
		);
		this.connectionGateway.server.to(invitedSocketId).emit('roomInvite', {
			inviterId: socket.data.user.id,
			roomName: messageBody.roomName,
		});
	}

	@SubscribeMessage('newChatRoomMessage')
	async onNewChatRoomMessage(
		@ConnectedSocket() socket: Socket,
		@MessageBody() messageBody: NewChatRoomMessageDTO,
	): Promise<void> {
		if (!this.isValidNewChatRoomMessageDTO(messageBody)) {
			this.logger.warn(
				'Client with socket id=' + socket.id + ' tried to send a wrong NewChatRoomMessageDTO',
			);
			return ;
		}

		const room: ChatRoom | null = await this.roomService.findRoomByName(messageBody.roomName);
		if (!room) {
			// TODO implement error response
			throw new Error('Room not found');
		}

		const userMuted: boolean = await this.roomService.checkIfUserIsMuted(socket.data.userId, room.id);
		if (userMuted) {
			this.logger.debug('User with id: ' + socket.data.userId + ' is muted. Message not sent');
			return ;
		}

		const message: ChatRoomMessageI = await this.messageService.newChatRoomMessage(
				socket.data.userId,
				room,
				messageBody.text,
			);

		const usersInRoom: number[] = room.users.map((user) => user.id);
		usersInRoom.forEach(async (uid) => {
			const blockRelationship: boolean = await this.friendshipService.isThereABlockRelationship(
					socket.data.userId,
					uid,
				);

			// Retrieve the socketId of the user
			const userSocketId: string = await this.connectionService.findSocketIdByUID(uid);
			if (userSocketId && !blockRelationship) {
				socket.to(userSocketId).emit('newChatRoomMessage', message);
			}
		});
	}

	@SubscribeMessage('newDirectMessage')
	async onNewDirectMessage(
		@ConnectedSocket() socket: Socket,
		@MessageBody() messageBody: OnDirectMessageDTO,
	): Promise<void> {
		if (!this.isValidOnDirectMessageDTO(messageBody)) {
			this.logger.warn(
				'Client with socket id=' + socket.id + ' tried to send a wrong OnDirectMessageDTO'
			);
			return;
		}

		if (socket.data.userId == messageBody.receiverUID) {
			// self message
			return;
		}

		const receiverSocketId: string | null =
			this.connectionService.findSocketIdByUID(messageBody.receiverUID);

		if (!receiverSocketId) {
			// TODO
			// user is offline or doesn't exist
			return;
		}

		const newDirectMessage: DirectMessageI =
			await this.messageService.newDirectMessage(
				socket.data.userId,
				messageBody.receiverUID,
				messageBody.text,
			);
		this.connectionGateway.server
			.to(receiverSocketId)
			.emit('newDirectMessage', newDirectMessage);
	}

	/*
		TODO Unban, Unmute, removeFromAdmin
		TODO Passwords

		Game Invite (I take this one)
 */

	private isValidJoinRoomDTO(messageBody: any): messageBody is JoinRoomDTO {
		return (
			typeof messageBody === 'object' &&
			typeof messageBody.name === 'string'
		);
	}

	private isValidInviteToRoomDTO(
		messageBody: any,
	): messageBody is InviteToRoomDTO {
		return (
			typeof messageBody === 'object' &&
			typeof messageBody.invitedUID === 'number' &&
			messageBody.invitedUID > 0 &&
			typeof messageBody.roomName === 'string'
		);
	}

	private isValidNewChatRoomMessageDTO(
		messageBody: any,
	): messageBody is NewChatRoomMessageDTO {
		return (
			typeof messageBody === 'object' &&
			typeof messageBody.roomName === 'string' &&
			typeof messageBody.text === 'string'
		);
	}

	private isValidOnDirectMessageDTO(
		messageBody: any,
	): messageBody is OnDirectMessageDTO {
		return (
			typeof messageBody === 'object' &&
			typeof messageBody.receiverUID === 'number' &&
			typeof messageBody.text === 'string'
		);
	}
}

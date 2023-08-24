import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	forwardRef,
	Inject,
	Injectable,
	Logger,
	NotAcceptableException,
	NotFoundException,
	UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { ChatRoom, DirectMessage, User } from 'src/entity';
import { Repository } from 'typeorm';
import {
	ChatRoomI,
	ChatRoomSearchInfo,
	ChatRoomType,
	ErrorResponse,
	SuccessResponse,
} from 'types';
import { ConnectionGateway } from '../connection/connection.gateway';
import { ConnectionService } from '../connection/connection.service';
import { DirectMessageReceivedDTO } from '../friendships/dto/direct-message-received.dto';
import { UsersService } from '../users/users.service';
import { CreateRoomDTO } from './dto/create-room.dto';

@Injectable()
export class ChatService {
	constructor(
		@InjectRepository(ChatRoom)
		private readonly chatRoomRepository: Repository<ChatRoom>,
		@Inject(forwardRef(() => UsersService))
		private readonly usersService: UsersService,
		@Inject(forwardRef(() => ConnectionService))
		private readonly connectionService: ConnectionService,
		@Inject(forwardRef(() => ConnectionGateway))
		private readonly connectionGateway: ConnectionGateway,
		@InjectRepository(DirectMessage)
		private readonly directMessageRepository: Repository<DirectMessage>,
	) { }

	private readonly logger: Logger = new Logger(ChatService.name);

	private mutedUsers: { roomId: number; userId: number }[] = [];

	/****************************
	 *           DMs            *
	 *****************************/

	async createDirectMessage(
		senderUID: number,
		receiverUID: number,
		uniqueId: string,
		content: string,
	): Promise<DirectMessage> {
		const newMessage: DirectMessage = this.directMessageRepository.create({
			unique_id: uniqueId,
			content: content,
			receiver: { id: receiverUID },
			sender: { id: senderUID },
		});

		return await this.directMessageRepository.save(newMessage);
	}

	async sendMissedDirectMessages(
		receiverSocketId: string,
		receiverUID: number,
	): Promise<void> {
		// We only keep the unsent direct messages on the db
		// thus all the messages on the db are unsent

		/* Left join sender, select every message where receiverId = receiverUID
		and because on the db the message with the biggest id will be the newest
		we must sort in ascending order by id (oldest at [0]) to emit them
		from the oldest to the newest */
		const missedDMs: DirectMessage[] = await this.directMessageRepository
			.createQueryBuilder('direct_message')
			.leftJoinAndSelect('direct_message.sender', 'sender')
			.where('direct_message.receiver_id = :receiverUID', { receiverUID })
			.orderBy('direct_message.id', 'ASC')
			.getMany();

		if (!missedDMs) return;

		// Send every missed DM
		missedDMs.forEach((dm: DirectMessage) => {
			const directMessageReceived: DirectMessageReceivedDTO = {
				content: dm.content,
				senderUID: dm.sender.id,
				uniqueId: dm.unique_id,
			};

			this.connectionGateway.server
				.to(receiverSocketId)
				.emit('directMessageReceived', directMessageReceived);
		});

		// After sending all missed direct messages we can delete them from db
		await this.directMessageRepository.delete({
			receiver: { id: receiverUID },
		});
	}

	/****************************
	 *          ROOMS           *
	 *****************************/

	/* Check room name for:
			Unique
			Length boundaries (4-10)
			Composed only by a-z, A-Z, 0-9 and  _
	*/
	public async createRoom(
		createRoomDto: CreateRoomDTO,
		owner: User,
	): Promise<ChatRoom> {
		// If room name's already taken
		const room: ChatRoom | null = await this.findRoomByName(createRoomDto.name);
		if (room) {
			this.logger.warn(
				`${owner.name} tried to create a room with already taken name: "${createRoomDto.name}"`,
			);
			throw new ConflictException('Room name is already taken');
		}

		this.checkForValidRoomName(createRoomDto.name);

		if (
			createRoomDto.type !== ChatRoomType.PROTECTED &&
			createRoomDto.password
		) {
			this.logger.warn(
				`${owner.name} tried to create a ${createRoomDto.type} createRoomDto with password`,
			);
			throw new BadRequestException(
				`A ${createRoomDto.type} room cannot have a password`,
			);
		}

		if (createRoomDto.type === ChatRoomType.PROTECTED) {
			this.checkForValidRoomPassword(createRoomDto.password);
		}

		const newRoom: ChatRoom = this.chatRoomRepository.create(createRoomDto);

		/* Add the owner to the users in the room,
			to the list of admins,
			and as the owner */
		newRoom.users = [owner];
		newRoom.admins = [owner];
		newRoom.owner = owner;

		const ownerSocketId: string | undefined =
			this.connectionService.findSocketIdByUID(owner.id.toString());

		if (ownerSocketId) {
			this.connectionGateway.server
				.to(ownerSocketId)
				.socketsJoin(createRoomDto.name);
		}
		return this.chatRoomRepository.save(newRoom);
	}

	public async joinRoom(
		user: User,
		roomId: number,
		password?: string,
	): Promise<SuccessResponse | ErrorResponse> {
		const room: ChatRoom | null = await this.findRoomById(roomId);
		if (!room) {
			throw new NotFoundException(`Room with id=${roomId} doesn't exist`);
		}

		if (await this.isUserBannedFromRoom(room, user.id)) {
			throw new ForbiddenException(`You're banned from room "${room.name}"`);
		}

		if (await this.isUserInRoom(room, user.id)) {
			this.logger.warn(
				`${user.name} tried to join a room where he's already in (room: "${room.name}")`,
			);
			throw new ConflictException(`You\'re already in room "${room.name}"`);
		}

		if (room.type === ChatRoomType.PROTECTED) {
			if (password !== room.password) {
				return;
			}
		}

		room.users.push(user);
		this.chatRoomRepository.save(room);

		const socketIdOfJoiningUser: string =
			this.connectionService.findSocketIdByUID(user.id.toString());

		this.connectionGateway.server
			.to(socketIdOfJoiningUser)
			.socketsJoin(room.name);

		const username: string = user.name;

		this.connectionGateway.server
			.to(socketIdOfJoiningUser)
			.emit('userJoinedRoom', { username: username });
		return { message: `Successfully joined room "${room.name}"` };
	}

	public async joinUserRooms(client: Socket): Promise<void> {
		const roomsToJoin: ChatRoomI[] | null =
			await this.usersService.findChatRoomsWhereUserIs(client.data.userId);

		if (!roomsToJoin) {
			this.logger.debug('No rooms to join');
			return;
		}

		const roomNames: string[] = roomsToJoin.map((room) => room.name);

		client.join(roomNames);
	}

	public async inviteToRoom(
		inviterUID: number,
		receiverUID: number,
		roomId: number,
	): Promise<SuccessResponse | ErrorResponse> {
		const receiver: User | null = await this.usersService.findUserByUID(
			receiverUID,
		);
		if (!receiver) {
			throw new NotFoundException(`User with UID=${receiverUID} doesn't exist`);
		}

		const room: ChatRoom | null = await this.findRoomById(roomId);
		if (!room) {
			throw new NotFoundException(`Room with id=${roomId} doesn't exist`);
		}

		const receiverSocketId: string | undefined =
			this.connectionService.findSocketIdByUID(receiverUID.toString());

		if (receiverSocketId) {
			this.connectionGateway.server.to(receiverSocketId).emit('roomInvite', {
				inviterUID: inviterUID,
				roomId: roomId,
			});
		}

		return { message: 'Succesfully sent invite to room' };
	}

	public async assignAdminRole(
		senderId: number,
		userToAssignRoleId: number,
		roomId: number,
	): Promise<SuccessResponse | ErrorResponse> {
		const room: ChatRoom | null = await this.findRoomById(roomId);
		if (!room) {
			throw new NotFoundException(`Room with id=${roomId} doesn't exist`);
		}

		const userToAssignRole: User | null = await this.usersService.findUserByUID(
			userToAssignRoleId,
		);
		if (!userToAssignRole) {
			throw new NotFoundException(
				`User with uid=${userToAssignRole} doesn't exist`,
			);
		}

		if (await this.isUserAnAdmin(room, userToAssignRoleId)) {
			throw new ConflictException('User already have admin privileges');
		}

		room.admins.push(userToAssignRole);
		this.chatRoomRepository.save(room);
		this.logger.log(
			`"${userToAssignRole.name}" is now an admin on room: "${room.name}"`,
		);
		return {
			message: `Succesfully assign admin privileges to "${userToAssignRole.name}" on room "${room.name}"`,
		};
	}

	public async removeAdminRole(
		userIdToRemoveRole: number,
		roomId: number,
	): Promise<SuccessResponse | ErrorResponse> {
		const room: ChatRoom | null = await this.findRoomById(roomId);
		if (!room) {
			throw new NotFoundException(`Room with id=${roomId} doesn't exist`);
		}

		const userToRemoveRole: User | null = await this.usersService.findUserByUID(
			userIdToRemoveRole,
		);
		if (!userToRemoveRole) {
			throw new NotFoundException(
				`User with uid=${userToRemoveRole} doesn't exist`,
			);
		}

		room.admins = room.admins.filter(
			(user: User) => user.id !== userIdToRemoveRole,
		);
		this.chatRoomRepository.save(room);
		this.logger.log(
			`${userToRemoveRole.name} is no longer an admin in room: "${room.name}"`,
		);

		return {
			message: `Succesfully removed admin privileges from "${userToRemoveRole.name}" on room "${room.name}"`,
		};
	}

	public async banFromRoom(
		senderId: number,
		userToBanId: number,
		roomId: number,
	): Promise<SuccessResponse | ErrorResponse> {
		const room: ChatRoom | null = await this.findRoomById(roomId);
		if (!room) {
			throw new NotFoundException(`Room with id=${roomId}" doesn't exist`);
		}

		if (senderId === userToBanId) {
			this.logger.warn(
				`UID= ${senderId} tried to ban himself from room: "${room.name}"`,
			);
			throw new ConflictException(`You cannot ban yourself`);
		}

		const userToBan: User | null = await this.usersService.findUserByUID(
			userToBanId,
		);
		if (!userToBan) {
			throw new NotFoundException(`User with uid=${userToBanId} doesn't exist`);
		}

		room.bans.push(userToBan);
		await this.chatRoomRepository.save(room);

		await this.leaveRoom(room, userToBanId, false);

		this.connectionGateway.server
			.to(room.name)
			.emit('userWasBannedFromRoom', { userId: userToBanId });

		this.logger.log(`${userToBan.name} was banned from room "${room.name}"`);
		return {
			message: `Succesfully banned "${userToBan.name}" from room "${room.name}"`,
		};
	}

	public async unbanFromRoom(
		senderId: number,
		userToUnbanId: number,
		roomId: number,
	): Promise<SuccessResponse | ErrorResponse> {
		const room: ChatRoom | null = await this.findRoomById(roomId);
		if (!room) {
			throw new NotFoundException(`Room with id=${roomId}" doesn't exist`);
		}

		const userToUnban: User | null = await this.usersService.findUserByUID(
			userToUnbanId,
		);
		if (!userToUnban) {
			throw new NotFoundException(
				`User with uid=${userToUnbanId} doesn't exist`,
			);
		}

		room.bans = room.bans.filter((user) => user.id !== userToUnbanId);
		this.chatRoomRepository.save(room);

		this.logger.log(
			`${userToUnban.name} was unbanned from room "${room.name}"`,
		);
		return {
			message: `Succesfully unbanned "${userToUnban.name}" from room "${room.name}"`,
		};
	}

	public async kickFromRoom(
		senderId: number,
		userToKickId: number,
		roomId: number,
	): Promise<SuccessResponse | ErrorResponse> {
		const room: ChatRoom | null = await this.findRoomById(roomId);
		if (!room) {
			throw new NotFoundException(`Room with id=${roomId}" doesn't exist`);
		}

		if (senderId === userToKickId) {
			this.logger.warn(
				`UID= ${senderId} tried to kick himself from room: "${room.name}"`,
			);
			throw new ConflictException('You cannot kick yourself');
		}

		const userToKick: User | null = await this.usersService.findUserByUID(
			userToKickId,
		);
		if (!userToKick) {
			throw new NotFoundException(
				`User with uid=${userToKickId} doesn't exist`,
			);
		}

		this.connectionGateway.server
			.to(room.name)
			.emit('userWasKickedFromRoom', { userId: userToKickId });
		await this.leaveRoom(room, userToKickId, false);

		this.logger.log(`${userToKick.name} was kicked from room "${room.name}"`);
		return {
			message: `Successfully kicked "${userToKick.name}" from room "${room.name}"`,
		};
	}

	public async findRoomById(roomId: number): Promise<ChatRoom | null> {
		return await this.chatRoomRepository.findOne({
			relations: {
				admins: true,
				bans: true,
				owner: true,
				users: true,
			},
			where: { id: roomId },
		});
	}

	public async findRoomByName(name: string): Promise<ChatRoom | null> {
		return await this.chatRoomRepository.findOne({
			relations: {
				admins: true,
				bans: true,
				owner: true,
				users: true,
			},
			where: { name: name },
		});
	}

	public async findRoomsByRoomNameProximity(
		chatRoomNameQuery: string,
	): Promise<ChatRoomSearchInfo[]> {
		const chatRooms: ChatRoom[] = await this.chatRoomRepository
			.createQueryBuilder('chat_room')
			.leftJoin('chat_room.owner', 'owner')
			.where('chat_room.name LIKE :roomNameProximity', {
				roomNameProximity: chatRoomNameQuery + '%',
			})
			.andWhere("chat_room.type != 'private'")
			.getMany();

		const chatRoomSearchInfos: ChatRoomSearchInfo[] = chatRooms.map(
			(room: ChatRoom) => ({
				name: room.name,
				protected: room.type === ChatRoomType.PROTECTED ? true : false,
			}),
		);
		return chatRoomSearchInfos;
	}

	public async leaveRoom(
		room: ChatRoom,
		userLeavingId: number,
		emitUserHasLeftTheRoom: boolean,
	): Promise<void> {
		const socketIdOfLeavingUser: string =
			this.connectionService.findSocketIdByUID(userLeavingId.toString());

		// If owner is leaving, emit a ownerHasLeftTheRoom event
		// and delete the room from db
		if (userLeavingId == room.owner.id) {
			this.connectionGateway.server
				.to(room.name)
				.emit('ownerHasLeftTheRoom', { room: room.name });

			this.connectionGateway.server.to(room.name).socketsLeave(room.name);
			await this.chatRoomRepository.delete(room);
		} else {
			room.users = room.users.filter((user) => user.id !== userLeavingId);
			await this.chatRoomRepository.save(room);

			/* In case this function is being used by kickFromRoom or banFromRoom
			(they will have their own events) */
			if (!emitUserHasLeftTheRoom) return;

			this.connectionGateway.server.to(room.name).emit('userHasLeftTheRoom', {
				room: room.name,
				userId: userLeavingId,
			});
		}

		// Kick userLeaving from server
		this.connectionGateway.server
			.to(socketIdOfLeavingUser)
			.socketsLeave(room.name);
	}

	public async muteUser(
		userToMuteId: number,
		durationInMs: number,
		roomId: number,
	): Promise<SuccessResponse | ErrorResponse> {
		const room: ChatRoom | null = await this.findRoomById(roomId);
		if (!room) {
			throw new NotFoundException(`Room with id=${roomId}" doesn't exist`);
		}

		const userToMute: User | null = await this.usersService.findUserByUID(
			userToMuteId,
		);
		if (!userToMute) {
			throw new NotFoundException(
				`User with uid=${userToMuteId} doesn't exist`,
			);
		}

		this.mutedUsers.push({
			roomId: room.id,
			userId: userToMuteId,
		});

		setTimeout(async () => {
			await this.unmuteUser(userToMuteId, roomId);
		}, durationInMs);

		this.logger.log(
			`"${userToMute.name}" is now muted on room: "${room.name}"`,
		);
		return { message: `Succesfully muted "${userToMute.name}"` };
	}

	public async unmuteUser(
		userToUnmuteId: number,
		roomId: number,
	): Promise<SuccessResponse | ErrorResponse> {
		const room: ChatRoom | null = await this.findRoomById(roomId);
		if (!room) {
			throw new NotFoundException(`Room with id=${roomId}" doesn't exist`);
		}

		const userToUnmute: User | null = await this.usersService.findUserByUID(
			userToUnmuteId,
		);
		if (!userToUnmute) {
			throw new NotFoundException(
				`User with uid=${userToUnmuteId} doesn't exist`,
			);
		}

		const indexToRemove: number = this.mutedUsers.findIndex(
			(entry) => entry.userId === userToUnmuteId && entry.roomId === room.id,
		);

		if (indexToRemove !== -1) {
			this.mutedUsers.splice(indexToRemove, 1);
			this.logger.log(
				`${userToUnmute.name} was unmuted on room: "${room.name}"`,
			);
		}
		return { message: `Succesfully unmuted "${userToUnmute.name}"` };
	}

	public async updateRoomPassword(
		newPassword: string,
		roomId: number,
	): Promise<SuccessResponse | ErrorResponse> {
		const room: ChatRoom | null = await this.findRoomById(roomId);
		if (!room) {
			throw new NotFoundException(`Room with id=${roomId}" doesn't exist`);
		}

		// If the room was public now it is protected
		if (room.type !== ChatRoomType.PROTECTED) {
			room.type = ChatRoomType.PROTECTED;
		}

		room.password = newPassword;

		await this.chatRoomRepository.save(room);
		return { message: `Succesfully updated room's password` };
	}

	public async removeRoomPassword(
		roomId: number,
	): Promise<SuccessResponse | ErrorResponse> {
		const room: ChatRoom | null = await this.findRoomById(roomId);
		if (!room) {
			throw new NotFoundException(`Room with id=${roomId}" doesn't exist`);
		}

		if (room.type != ChatRoomType.PROTECTED) {
			throw new BadRequestException('Room is not protected');
		}

		room.type = ChatRoomType.PUBLIC;
		room.password = null;

		await this.chatRoomRepository.save(room);
		return { message: `Succesfully updated room's password` };
	}

	public checkForValidRoomName(name: string): void {
		// If room name doesn't respect the boundaries (4-10 chars longs)
		if (!(name.length >= 4 && name.length <= 10)) {
			throw new UnprocessableEntityException(
				'Room names must be 4-10 chars long',
			);
		}

		// If room name is not composed only by a-z, A-Z, 0-9, _
		if (!name.match('^[a-zA-Z0-9_]+$')) {
			throw new NotAcceptableException(
				'Room names can only be composed by letters (both cases), numbers and underscore',
			);
		}
	}

	public checkForValidRoomPassword(password: string): void {
		if (!password) {
			throw new BadRequestException(`A protected room must have a password`);
		}

		if (!(password.length >= 4 && password.length <= 20)) {
			throw new UnprocessableEntityException(
				`Room passwords must be 4-20 chars long`,
			);
		}

		// Check if password doesn't contain white spaces or special unicode chars
		if (password.match('^[a-zA-Z0-9!@#$%^&*()_+{}[]:;<>,.?~=/\\|-]+$')) {
			throw new BadRequestException(
				`Room passwords must be only composed by letters (both cases), numbers and special characters`,
			);
		}
	}

	public async isUserAnAdmin(room: ChatRoom, userId: number): Promise<boolean> {
		return room.admins.find((admin: User) => {
			admin.id == userId;
		})
			? true
			: false;
	}

	public async isUserBannedFromRoom(
		room: ChatRoom,
		userId: number,
	): Promise<boolean> {
		return room.bans.find((user: User) => {
			user.id == userId;
		})
			? true
			: false;
	}

	public async isUserInRoom(room: ChatRoom, userId: number): Promise<boolean> {
		return room.users.find((user: User) => {
			user.id == userId;
		})
			? true
			: false;
	}

	public async isUserMuted(userId: number, roomId: number): Promise<boolean> {
		return this.mutedUsers.findIndex((entry) => {
			return entry.userId === userId && entry.roomId === roomId;
		}) !== -1
			? true
			: false;
	}
}

import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { ChatRoomI } from 'src/common/types/chat-room.interface';
import { User } from 'src/entity/user.entity';
import { Repository } from 'typeorm';
import { ChatRoom, ChatRoomType } from '../../entity/chat-room.entity';
import { CreateRoomDTO } from './dto/create-room.dto';
import { UsersService } from '../users/users.service';
import { ChatRoomSearchInfo } from 'src/common/types/chat-room-search-info.interface';

const mutedUsers: { userId: number; roomId: number; muteTime: number }[] = [];

@Injectable()
export class RoomService {
	constructor(
		@InjectRepository(ChatRoom)
		private readonly chatRoomRepository: Repository<ChatRoom>,
		@Inject(forwardRef(() => UsersService))
		private readonly usersService: UsersService,
		) {}

	private readonly logger: Logger = new Logger(RoomService.name);

	public async createRoom(
		createRoomDto: CreateRoomDTO,
		creator: User,
	): Promise<ChatRoom> {
		// TODO delete debugs
		const newRoom: ChatRoom = this.chatRoomRepository.create(createRoomDto);

		// Add the creator to the users in the room
		newRoom.users = [creator];
		newRoom.admins = [creator];
		newRoom.owner = creator;

		this.logger.debug('Room "' + newRoom.name + '" created');
		return this.chatRoomRepository.save(newRoom);
	}

	public async joinRoom(room: ChatRoom, user: User): Promise<void> {
		if(await this.findUserInRoomById(room, user.id)) {
			this.logger.debug('User is already in the room ' + room.name);
			return ;
		}

		room.users.push(user);
		this.chatRoomRepository.save(room);
		this.logger.debug('Room: ' + JSON.stringify(room, null, 2))
	}

	public async leaveRoom(room: ChatRoom, userId: number): Promise<void> {
		if (!await this.checkIfUserIsValidForAdminAction(room, userId))
			return ;

		const user: User | null = await this.usersService.findUserByUID(userId);
		if (!user) {
			this.logger.debug('Error retreiving user');
			return ;
		}

		room.users = room.users.filter(user => user.id !== userId);
		this.chatRoomRepository.save(room);
	}

	public async banRoom(room: ChatRoom, userId: number): Promise<void> {
		const user: User | null = await this.usersService.findUserByUID(userId);
		if (!user) {
			this.logger.debug('Error retreiving user');
			return ;
		}

		room.bans.push(user);
		this.chatRoomRepository.save(room);
	}

	public async unbanRoom(room: ChatRoom, userId: number): Promise<void> {
		if (!await this.checkIfUserIsValidForAdminAction(room, userId)){
			return ;
		}

		const user: User | null = await this.usersService.findUserByUID(userId);
		if (!user) {
			this.logger.debug('Error retreiving user');
			return ;
		}

		room.bans = room.bans.filter(user => user.id !== userId);
		this.chatRoomRepository.save(room);
	}

	public async muteUser(userId: number, duration: number, room: ChatRoom) {
		if (!await this.checkIfUserIsValidForAdminAction(room, userId)) {
			return ;
		}
		
		const existingIndex = mutedUsers.findIndex(
			entry => entry.userId === userId && entry.roomId === room.id
		);
		
		if (existingIndex !== -1) {
			mutedUsers[existingIndex].muteTime = Date.now() + duration;
		} else {
			mutedUsers.push({
				userId,
				roomId: room.id,
				muteTime: Date.now() + duration,
			});
		}
		this.logger.debug('User with id ' + userId + ' is now muted');
		
		setTimeout(() => {
			// Remove the user's entry from the muted list when the timer expires
			const indexToRemove = mutedUsers.findIndex(
				entry => entry.userId === userId && entry.roomId === room.id
			);
			if (indexToRemove !== -1) {
				mutedUsers.splice(indexToRemove, 1);
				this.logger.debug('User with id ' + userId + ' is now unmuted');
			}
		}, duration);
	}

	public async unmuteUser(userId: number, duration: number, room: ChatRoom) {
		if (!await this.checkIfUserIsValidForAdminAction(room, userId)) {
			return ;
		}
		
		const indexToRemove = mutedUsers.findIndex(
			entry => entry.userId === userId && entry.roomId === room.id
		);
		
		if (indexToRemove !== -1) {
			mutedUsers.splice(indexToRemove, 1);
			this.logger.debug('User with id ' + userId + ' is now unmuted');
		} else {
			this.logger.debug('User with id ' + userId + ' is not muted');
		}
	}

	public async joinUserRooms(client: Socket) {
		const roomsToJoin: ChatRoomI[] | null =
			await this.usersService.findChatRoomsWhereUserIs(client.data.userId);

		if (!roomsToJoin) {
			this.logger.debug('No rooms to join');
			return;
		}

		const roomNames: string[] = roomsToJoin.map((room) => room.name);

		// Join each room
		for (const roomName of roomNames) {
			// TODO delete debug
			this.logger.debug('Joining Room "' + roomName + '"');
			await client.join(roomName);
		}
	}

	public async addUserAsAdmin(room: ChatRoom, userId: number) {
		if (!await this.checkIfUserIsValidForAdminAction(room, userId))
			return ;

		const user: User | null = await this.usersService.findUserByUID(userId);
		if (!user) {
			this.logger.debug('Error retreiving user');
			return ;
		}

		room.admins.push(user);
		this.chatRoomRepository.save(room);
		this.logger.debug('User ' + user.name + ' is now an admin in ' + room.name);
	}

	public async removeUserfromAdmin(room: ChatRoom, userId: number) {
		if (await this.checkIfUserIsAdmin(room, userId))
			return ;

		const user: User | null = await this.usersService.findUserByUID(userId);
		if (!user) {
			this.logger.debug('Error retreiving user');
			return ;
		}

		room.admins = room.admins.filter(user => user.id !== userId);
		this.chatRoomRepository.save(room);
		this.logger.debug(user.name + ' is no longer an admin in ' + room.name);
	}

	//////////////////
	// ? Finders ? //
	/////////////////

	public async findRoomById(id: number): Promise<ChatRoom | null> {
		const room: ChatRoom | null = await this.chatRoomRepository.findOne({
			where: { id: id },
			relations: ['users', 'owner', 'admins', 'bans'],
		});

		return room;
	}

	public async findRoomByName(name: string): Promise<ChatRoom | null> {
		const room: ChatRoom = await this.chatRoomRepository.findOne({
			where: { name: name },
			relations: ['users', 'owner', 'admins', 'bans'],
		});

		if (!room) {
			return null;
		}
		return room;
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
			.andWhere('chat_room.type NOT private')
			.getMany();
			
		const chatRommSearchInfos: ChatRoomSearchInfo[] = chatRooms.map(
			(room: ChatRoom) => ({
				name: room.name,
				protected: room.type === ChatRoomType.PROTECTED ? true : false,
			}),
		);
		return chatRommSearchInfos;
	}

	public async findUserInRoomById(room: ChatRoom, UserID: number): Promise<boolean> {
		const userArray: number[] = room.users.map(user => user.id);

		for (let i = 0; i < userArray.length; i++) {
			if (userArray[i] == UserID) {
				return true;
			}
		}
		return false;
	}

	//////////////////
	// ? Utils ? //
	/////////////////

	public async checkIfUserBannedFromRoom(room: ChatRoom, UserID: number): Promise<boolean> {
		const userArray: number[] = room.bans.map(user => user.id);

		for (let i = 0; i < userArray.length; i++) {
			if (userArray[i] == UserID) {
				this.logger.debug('User banned from room');
				return true;
			}
		}
		this.logger.debug('User not banned');
		return false;
	}

	public async checkIfUserIsAdmin(room: ChatRoom, UserID: number): Promise<boolean> {
		const userArray: number[] = room.admins.map(user => user.id);

		for (let i = 0; i < userArray.length; i++) {
			if (userArray[i] == UserID) {
				return true;
			}
		}
		return false;
	}

	public async checkIfUserIsMuted(userId: number, roomId: number): Promise<boolean> {
		const existingIndex = mutedUsers.findIndex(
			entry => entry.userId === userId && entry.roomId === roomId
		);
		
		if (existingIndex !== -1) {
			this.logger.debug('User muted');
			return true;
		}
		
		this.logger.debug('User not muted');
		return false;
	}

	public async checkIfUserIsValidForAdminAction(room: ChatRoom, userId: number): Promise<boolean> {
		const user: User | null = await this.usersService.findUserByUID(userId);
		if (!user) {
			this.logger.debug('User with id: ' + userId + ' doesn\'t exist');
			return false;
		}

		if(!await this.findUserInRoomById(room, userId)) {
			this.logger.debug(user.name + ' is not in the room ' + room.name);
			return false;
		}

		if (await this.checkIfUserIsAdmin(room, userId)) {
			this.logger.warn('User ' + user.name + ' is an admin on room: ' + room.name);
			return false;
		}
		return true;
	}

}
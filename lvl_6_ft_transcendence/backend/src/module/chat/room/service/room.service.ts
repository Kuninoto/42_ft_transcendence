import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoom } from '../entity/chatRoom.entity';
import { Repository } from 'typeorm';
import { RoomDto } from '../entity/room.dto';
import { RoomI } from '../entity/room.interface';
import { UserI } from 'src/entity/user.interface';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { User } from 'src/entity/user.entity';
import { Socket } from 'socket.io';
import { stringify } from 'querystring';


@Injectable()
export class RoomService {

	constructor(
		@InjectRepository(ChatRoom)
		private readonly roomRepo: Repository<ChatRoom>,
		@InjectRepository(User)
		private readonly userRepo: Repository<User>
	) {}

	async createRoom(room: RoomI, creator: User): Promise<RoomI> {
		// TODO
		const newRoom = this.roomRepo.create({ name: room.name, owner: creator.name, ownerId: creator.id });
		newRoom.users = [creator]; // Associate users with the chat room
		Logger.debug('Owner: ' + creator.name);
		Logger.debug('Room: ' + JSON.stringify(newRoom, null, 2));
		return this.roomRepo.save(newRoom);
	}
	
	async joinRoom(roomName: string, user: User) {
		const room = await this.findRoomByName(roomName);

		// TODO delete Logger logs
		if (room) {
			Logger.debug('------- Testing joining room -------');
			Logger.debug('Room id: ' + room.id);
			Logger.debug('Room name: ' + room.name);
			Logger.debug('Room users: ' + JSON.stringify(room.users, null, 2));
			Logger.debug('------------------------------------');

			// return ;

			// room.users = room.users;
			room.users.push(user);

			Logger.debug('------- Testing joined room -------');
			Logger.debug('Room id: ' + room.id);
			Logger.debug('Room name: ' + room.name);
			Logger.debug('Room users: ' + JSON.stringify(room.users, null, 2));
			Logger.debug('-----------------------------------');
			
			return this.roomRepo.save(room);
		}
		return null;
	}
	
	async getRoomsForUser(userId: number, options: IPaginationOptions): Promise<Pagination<RoomI>> {
		const query = this.roomRepo
		.createQueryBuilder('room')
		.leftJoin('room.users', 'user')
		.where('user.id = :userId', {userId})

		return paginate(query, options);
	}

	async joinUserRooms(socket: Socket, rooms: RoomI[]) {
		Logger.debug('Room: ' + JSON.stringify(rooms, null, 2));
		if (!rooms) {
			Logger.error('Rooms array is undefined.');
			return;
		}

		const roomNames : string[] = this.getNamesFromRooms(rooms); // Get room names from rooms
		
		for (const roomName of roomNames) {
			Logger.debug('Room name: ' + roomName);
			await socket.join(roomName); // Join each room
		}
	  }
	  
	private getNamesFromRooms(rooms: RoomI[]): string[] {
		const names = rooms.map(room => room.name);
		return names;
	  }

	//////////////////
	// ? Finders ? //
	/////////////////

	public async findRoomById(id: number): Promise<ChatRoom | null> {
		const room = await this.roomRepo.findOne({
			where: { id },
			relations: ['users']
		});

		if (!room) {
			return null;
		}

		return room;
	}

	public async findUserRooms(id: number): Promise<RoomI[] | null> {
		const rooms : RoomI[] = (await this.userRepo.findOne({
			where: { id },
			relations: ['room']
		}))?.room;

		if (!rooms) {
			return null;
		}

		return rooms;
	}

	public async findRoomByName(name: string): Promise<ChatRoom | null> {
		const room = await this.roomRepo.findOne({
			where: { name },
			relations: ['users']
		});

		if (!room) {
			return null;
		}

		return room;
	}
}

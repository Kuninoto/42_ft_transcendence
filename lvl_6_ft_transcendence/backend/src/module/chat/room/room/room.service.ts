import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoom } from '../../entities/chatRoom.entity';
import { Repository } from 'typeorm';
import { RoomDto } from '../../chat/dto/room.dto';
import { RoomI } from '../../entities/room.interface';
import { UserI } from 'src/entity/user.interface';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { User } from 'src/entity/user.entity';


@Injectable()
export class RoomService {

	constructor(
		@InjectRepository(ChatRoom)
		private readonly roomRepo: Repository<ChatRoom>
	) {}

	async createRoom(room: RoomI, creator: User): Promise<RoomI> {
		// TODO
		const newRoom = this.roomRepo.create({ name: room.name, owner: creator.name, ownerId: creator.id });
		newRoom.users = [creator]; // Associate users with the chat room
		console.debug('Owner: ' + creator.name);
		console.debug('Users: ' + JSON.stringify(room.users, null, 2));
		return this.roomRepo.save(newRoom);
	}
	
	async joinRoom(roomName: string, user: User) {
		const room = await this.findRoomByName(roomName);

		// TODO delete console logs
		if (room) {
			console.debug('------- Testing joining room -------');
			console.debug('Room id: ' + room.id);
			console.debug('Room name: ' + room.name);
			console.debug('Room users: ' + JSON.stringify(room.users, null, 2));
			console.debug('------------------------------------');

			return ;

			room.users = room.users || [];
			room.users.push(user);

			console.debug('------- Testing joined room -------');
			console.debug('Room id: ' + room.id);
			console.debug('Room name: ' + room.name);
			console.debug('Room users: ' + JSON.stringify(room.users, null, 2));
			console.debug('-----------------------------------');
			
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

	//////////////////
	// ? Finders ? //
	/////////////////

	public async findRoomById(id: number): Promise<ChatRoom> | null  {
		const room = await this.roomRepo.findOneBy({ id: id });
		if (!room) {
			return null;
		}

		return room;
	}

	public async findRoomByName(name: string): Promise<ChatRoom> | null {
		const room = await this.roomRepo.findOne({ where: { name } });
		if (!room) {
			return null;
		}

		return room;
	}
}

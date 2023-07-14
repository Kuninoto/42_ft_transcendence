import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoom } from '../../entities/chatRoom.entity';
import { Repository } from 'typeorm';
import { RoomDto } from '../../chat/dto/room.dto';
import { RoomI } from '../../entities/room.interface';
import { UserI } from 'src/entity/user.interface';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';


@Injectable()
export class RoomService {

	constructor(
		@InjectRepository(ChatRoom)
		private readonly roomRepo: Repository<ChatRoom>
	) {}

	async createRoom(room: RoomDto/*, creator: UserI*/): Promise<RoomDto> {
		// TODO
		// const newRoom = await this.addCreatorToRoom(room, creator);
		const newRoom = this.roomRepo.create(room);
		return this.roomRepo.save(newRoom);
	}

	async getRoomsForUser(userId: number, options: IPaginationOptions): Promise<Pagination<RoomI>> {
		const query = this.roomRepo
		.createQueryBuilder('room')
		.leftJoin('room.users', 'user')
		.where('user.id = :userId', {userId})

		return paginate(query, options);
	}

	async addCreatorToRoom(room: RoomI, creator: UserI): Promise<RoomI> {
		room.users.push(creator);
		return room;
	}
}

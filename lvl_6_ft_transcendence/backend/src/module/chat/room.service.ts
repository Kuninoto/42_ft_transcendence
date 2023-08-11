import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { ChatRoomI } from 'src/common/types/chat-room.interface';
import { User } from 'src/entity/user.entity';
import { Repository } from 'typeorm';
import { ChatRoom } from '../../entity/chat-room.entity';
import { CreateRoomDTO } from './dto/create-room.dto';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  private readonly logger: Logger = new Logger(RoomService.name);

  public async createRoom(
    createRoomDto: CreateRoomDTO,
    creator: User,
  ): Promise<ChatRoom> {
    // TODO
    const newRoom: ChatRoom = this.chatRoomRepository.create(createRoomDto);

    // Add the creator to the users in the room
    newRoom.users = [creator];
    newRoom.owner = creator;

    return this.chatRoomRepository.save(newRoom);
  }

  public async joinRoom(roomName: string, user: User): Promise<void> {
    const room: ChatRoom = await this.findRoomByName(roomName);

    room.users.push(user);
    this.chatRoomRepository.save(room);
  }

  /* async getRoomsForUser(
    userId: number,
    options: IPaginationOptions,
  ): Promise<Pagination<ChatRoomI>> {
    const query = this.chatRoomRepository
      .createQueryBuilder('room')
      .leftJoin('room.users', 'user')
      .where('user.id = :userId', { userId });

    return paginate(query, options);
  } */

  public async joinUserRooms(socket: Socket, rooms: ChatRoomI[]) {
    this.logger.debug('Rooms to join: ' + JSON.stringify(rooms, null, 2));
    if (!rooms) {
      this.logger.error('Rooms array is undefined.');
      return;
    }

    // Get room names from rooms
    const roomNames: string[] = this.getNamesFromRooms(rooms);

    for (const roomName of roomNames) {
      this.logger.debug('Room name: ' + roomName);
      await socket.join(roomName); // Join each room
    }
  }

  private getNamesFromRooms(rooms: ChatRoomI[]): string[] {
    const names = rooms.map((room) => room.name);
    return names;
  }

  //////////////////
  // ? Finders ? //
  /////////////////

  public async findRoomById(id: number): Promise<ChatRoom | null> {
    const room: ChatRoom | null = await this.chatRoomRepository.findOne({
      where: { id: id },
      relations: ['users'],
    });

    return room;
  }

  public async findRoomsWhereUserIs(uid: number): Promise<ChatRoomI[] | null> {
    const rooms: ChatRoom[] | undefined = (
      await this.usersRepository.findOne({
        where: { id: uid },
        relations: ['chat_rooms', 'chat_rooms.owner', 'chat_rooms.users'],
      })
    )?.chat_rooms;

    if (!rooms) {
      return null;
    }

    const roomInterfaces: ChatRoomI[] = rooms.map((room: ChatRoom) => ({
      id: room.id,
      name: room.name,
      ownerName: room.owner.name,
      users: room.users,
    }));

    return roomInterfaces;
  }

  public async findRoomByName(name: string): Promise<ChatRoom | null> {
    const room: ChatRoom = await this.chatRoomRepository.findOne({
      where: { name: name },
      relations: {
        owner: true,
        users: true,
      },
    });

    if (!room) {
      return null;
    }
  }
}

import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { ChatRoomI } from 'src/common/types/chat-room.interface';
import { User } from 'src/entity/user.entity';
import { Repository } from 'typeorm';
import { ChatRoom } from '../../entity/chat-room.entity';
import { CreateRoomDTO } from './dto/create-room.dto';
import { UsersService } from '../users/users.service';

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

  public async joinUserRooms(client: Socket) {
    const roomsToJoin: ChatRoomI[] | null =
      await this.usersService.findChatRoomsWhereUserIs(client.data.userId);

    if (!roomsToJoin) {
      this.logger.error('No rooms to join');
      return;
    }

    const roomNames: string[] = roomsToJoin.map((room) => room.name);

    // Join each room
    for (const roomName of roomNames) {
      this.logger.debug('Joining Room "' + roomName + '"');
      await client.join(roomName);
    }
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

import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotAcceptableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { ChatRoom, User } from 'src/entity';
import { Repository } from 'typeorm';
import { ChatRoomI, ChatRoomSearchInfo, ChatRoomType } from 'types';

import { ConnectionGateway } from '../connection/connection.gateway';
import { ConnectionService } from '../connection/connection.service';
import { UsersService } from '../users/users.service';
import { CreateRoomDTO } from './dto/create-room.dto';

@Injectable()
export class RoomService {
  private readonly logger: Logger = new Logger(RoomService.name);

  private mutedUsers: { roomId: number; userId: number }[] = [];
  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ConnectionService))
    private readonly connectionService: ConnectionService,
    @Inject(forwardRef(() => ConnectionGateway))
    private readonly connectionGateway: ConnectionGateway,
  ) {}

  /* Check room name for:
      Unique name
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

    // If room name doesn't respect the boundaries (4-10 chars longs)
    if (!(createRoomDto.name.length > 4 && createRoomDto.name.length < 10)) {
      this.logger.warn(
        `${owner.name} tried to create a room with a name too big: "${createRoomDto.name}"`,
      );
      throw new UnprocessableEntityException(
        'Room names must be 4-10 chars long',
      );
    }

    if (!createRoomDto.name.match('^[a-zA-Z0-9_]+$')) {
      this.logger.warn(
        `${owner.name} tried to create a room with invalid chars: "${createRoomDto.name}"`,
      );
      throw new NotAcceptableException(
        'Room names can only be composed by letters (both cases), numbers and underscore',
      );
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
    senderId: number,
    joiningUser: User,
    room: ChatRoom,
    password?: string,
  ): Promise<void> {
    if (await this.isUserBannedFromRoom(room, senderId)) {
      this.logger.log(`UID= ${senderId} is banned from room: "${room.name}"`);
      return;
    }

    if (await this.isUserInRoom(room, joiningUser.id)) {
      this.logger.warn(
        `${joiningUser.name} tried to join a room where he's already in (room: "${room.name}")`,
      );
      return;
    }

    if (room.type === ChatRoomType.PROTECTED) {
      if (password !== room.password) {
        return;
      }
    }

    room.users.push(joiningUser);
    this.chatRoomRepository.save(room);

    const socketIdOfJoiningUser: string =
      this.connectionService.findSocketIdByUID(joiningUser.id.toString());

    this.connectionGateway.server
      .to(socketIdOfJoiningUser)
      .socketsJoin(room.name);

    const username: string = joiningUser.name;

    this.connectionGateway.server
      .to(socketIdOfJoiningUser)
      .emit('userJoinedRoom', { username: username });
  }

  public async joinUserRooms(client: Socket) {
    const roomsToJoin: ChatRoomI[] | null =
      await this.usersService.findChatRoomsWhereUserIs(client.data.userId);

    if (!roomsToJoin) {
      this.logger.debug('No rooms to join');
      return;
    }

    const roomNames: string[] = roomsToJoin.map((room) => room.name);

    client.join(roomNames);
  }

  public async assignAdminRole(room: ChatRoom, userId: number) {
    if (!(await this.isUserAnAdmin(room, userId))) return;

    const user: User = await this.usersService.findUserByUID(userId);

    room.admins.push(user);
    this.chatRoomRepository.save(room);
    this.logger.debug(`"${user.name}" is now an admin in ${room.name}`);
  }

  public async removeAdminRole(room: ChatRoom, userIdToRemoveRole: number) {
    if (!(await this.isUserAnAdmin(room, userIdToRemoveRole))) {
      this.logger.warn(
        `"${room.owner.name}" (owner) tried to remove admin role from user with uid= ${userIdToRemoveRole} but he's not an admin on room: "${room.name}"`,
      );
      return;
    }

    room.admins = room.admins.filter((user) => user.id !== userIdToRemoveRole);
    this.chatRoomRepository.save(room);
    this.logger.log(
      `UID= ${userIdToRemoveRole} is no longer an admin in room "${room.name}"`,
    );
  }

  public async banFromRoom(
    senderId: number,
    userToBanId: number,
    room: ChatRoom,
  ): Promise<void> {
    if (
      !(await this.isUserInRoom(room, senderId)) ||
      !(await this.isUserInRoom(room, userToBanId)) ||
      (await this.isUserAnAdmin(room, userToBanId))
    ) {
      return;
    }

    if (!(await this.isUserAnAdmin(room, senderId))) {
      this.logger.warn(
        `UID= ${userToBanId} tried to ban someone but he's not an admin on room: "${room.name}"`,
      );
      return;
    }
    if (userToBanId === room.owner.id) {
      // Some admin tried to ban the chatroom owner
      this.logger.warn(
        `UID= ${userToBanId} tried to ban the chatroom owner on room: "${room.name}"`,
      );
      return;
    }

    const user: User = await this.usersService.findUserByUID(userToBanId);

    room.bans.push(user);
    await this.chatRoomRepository.save(room);

    this.connectionGateway.server
      .to(room.name)
      .emit('userWasBannedFromRoom', { userId: userToBanId });

    await this.leaveRoom(room, userToBanId, false);
    this.logger.debug(
      `UID= ${userToBanId} was banned from room "${room.name}"`,
    );
  }

  public async unbanFromRoom(
    senderId: number,
    userToUnbanId: number,
    room: ChatRoom,
  ): Promise<void> {
    if (
      !(await this.isUserAnAdmin(room, senderId)) ||
      !(await this.isUserInRoom(room, senderId))
    ) {
      return;
    }

    room.bans = room.bans.filter((user) => user.id !== userToUnbanId);
    this.chatRoomRepository.save(room);

    this.logger.debug(
      `UID= ${userToUnbanId} was unbanned from room "${room.name}"`,
    );
  }

  public async kickFromRoom(
    room: ChatRoom,
    userToBanId: number,
  ): Promise<void> {
    if (!(await this.isUserAnAdmin(room, userToBanId))) {
      this.logger.warn(
        `UID= ${userToBanId} tried to kick someone but he's not an admin on room: "${room.name}"`,
      );
      return;
    }
    if (userToBanId === room.owner.id) {
      // Some admin tried to kick the chatroom owner
      this.logger.warn(
        `UID= ${userToBanId} tried to kick the chatroom owner on room: "${room.name}"`,
      );
      return;
    }

    this.connectionGateway.server
      .to(room.name)
      .emit('userWasKickedFromRoom', { userId: userToBanId });
    await this.leaveRoom(room, userToBanId, false);

    this.logger.debug(
      `UID= ${userToBanId} was kicked from room "${room.name}"`,
    );
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
      .andWhere('chat_room.type NOT private')
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
    // If owner is leaving, emit a ownerHasLeftTheRoom event
    // and delete the room from db
    if (userLeavingId == room.owner.id) {
      this.connectionGateway.server
        .to(room.name)
        .emit('ownerHasLeftTheRoom', { room: room.name });

      await this.chatRoomRepository.delete(room);
    }

    room.users = room.users.filter((user) => user.id !== userLeavingId);
    await this.chatRoomRepository.save(room);

    const socketIdOfLeavingUser: string =
      this.connectionService.findSocketIdByUID(userLeavingId.toString());

    // Kick userLeaving from server
    this.connectionGateway.server
      .to(socketIdOfLeavingUser)
      .socketsLeave(room.name);

    /* In case this function is being used by kickFromRoom or banFromRoom
    (they will have their own events) */
    if (!emitUserHasLeftTheRoom) return;

    this.connectionGateway.server.to(room.name).emit('userHasLeftTheRoom', {
      room: room.name,
      userId: userLeavingId,
    });
  }

  public async muteUser(
    senderId: number,
    userToMuteId: number,
    durationInMs: number,
    room: ChatRoom,
  ) {
    if (
      !(await this.isUserAnAdmin(room, senderId)) ||
      !(await this.isUserInRoom(room, senderId)) ||
      !(await this.isUserInRoom(room, userToMuteId)) ||
      (await this.isUserAnAdmin(room, userToMuteId))
    ) {
      return;
    }

    this.mutedUsers.push({
      roomId: room.id,
      userId: userToMuteId,
    });

    this.logger.debug(
      `UID= ${userToMuteId} is now muted on room: "${room.name}"`,
    );

    setTimeout(async () => {
      await this.unmuteUser(senderId, userToMuteId, room);
    }, durationInMs);
  }

  public async unmuteUser(
    senderId: number,
    userToUnmuteId: number,
    room: ChatRoom,
  ) {
    if (
      !(await this.isUserAnAdmin(room, senderId)) ||
      !(await this.isUserInRoom(room, senderId)) ||
      !(await this.isUserInRoom(room, userToUnmuteId))
    ) {
      return;
    }

    const indexToRemove: number = this.mutedUsers.findIndex(
      (entry) => entry.userId === userToUnmuteId && entry.roomId === room.id,
    );

    if (indexToRemove !== -1) {
      this.mutedUsers.splice(indexToRemove, 1);
      this.logger.debug(`UID= ${userToUnmuteId} is now unmuted`);
    } else {
      this.logger.debug(`UID= ${userToUnmuteId} is not muted`);
    }
  }

  public async updateRoomPassword(
    senderId: number,
    newPassword: string,
    room: ChatRoom,
  ): Promise<void> {
    // If sender is not the owner of the room
    // he can't change its password
    if (room.owner.id != senderId) {
      return;
    }

    // If the room was public now it is protected
    if (room.type !== ChatRoomType.PROTECTED) {
      room.type = ChatRoomType.PROTECTED;
    }

    room.password = newPassword;

    await this.chatRoomRepository.save(room);
  }

  public async removeRoomPassword(
    senderId: number,
    room: ChatRoom,
  ): Promise<void> {
    if (room.owner.id != senderId) return;

    if (room.type != ChatRoomType.PROTECTED) return;

    room.type = ChatRoomType.PUBLIC;
    room.password = null;

    await this.chatRoomRepository.save(room);
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

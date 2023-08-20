import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { ChatRoom, User } from 'src/typeorm';
import { Repository } from 'typeorm';
import { ChatRoomI, ChatRoomSearchInfo, ChatRoomType } from 'types';
import { ConnectionGateway } from '../connection/connection.gateway';
import { ConnectionService } from '../connection/connection.service';
import { UsersService } from '../users/users.service';
import { CreateRoomDTO } from './dto/create-room.dto';

@Injectable()
export class RoomService {
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

  private readonly logger: Logger = new Logger(RoomService.name);
  private mutedUsers: { userId: number; roomId: number }[] = [];

  public async createRoom(
    createRoomDto: CreateRoomDTO,
    creator: User,
  ): Promise<ChatRoom> {
    const newRoom: ChatRoom = this.chatRoomRepository.create(createRoomDto);

    /* Add the creator to the users in the room,
      to the list of admins,
      and as the owner */
    newRoom.users = [creator];
    newRoom.admins = [creator];
    newRoom.owner = creator;

    this.logger.log(
      `New chatroom "${newRoom.name}" created by ${newRoom.owner}`,
    );
    return this.chatRoomRepository.save(newRoom);
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

  public async joinRoom(
    senderId: number,
    joiningUser: User,
    room: ChatRoom,
    password?: string,
  ): Promise<void> {
    if (await this.isUserBannedFromRoom(room, senderId)) {
      this.logger.log(
        `User with uid= ${senderId} is banned from room: "${room.name}"`,
      );
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

  public async leaveRoom(
    room: ChatRoom,
    userLeavingId: number,
    emitUserHasLeftTheRoom: boolean,
  ): Promise<void> {
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

    this.connectionGateway.server
      .to(room.name)
      .emit('userHasLeftTheRoom', { userId: userLeavingId });
  }

  public async kickFromRoom(
    room: ChatRoom,
    userToBanId: number,
  ): Promise<void> {
    if (!(await this.isUserAnAdmin(room, userToBanId))) {
      this.logger.warn(
        `User with uid= ${userToBanId} tried to kick someone but he's not an admin on room: "${room.name}"`,
      );
      return;
    }
    if (userToBanId === room.owner.id) {
      // Some admin tried to kick the chatroom owner
      this.logger.warn(
        `User with uid= ${userToBanId} tried to kick the chatroom owner on room: "${room.name}"`,
      );
      return;
    }

    this.connectionGateway.server
      .to(room.name)
      .emit('userWasKickedFromRoom', { userId: userToBanId });
    await this.leaveRoom(room, userToBanId, false);

    this.logger.debug(
      `User with uid= ${userToBanId} was kicked from room "${room.name}"`,
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
        `User with uid= ${userToBanId} tried to ban someone but he's not an admin on room: "${room.name}"`,
      );
      return;
    }
    if (userToBanId === room.owner.id) {
      // Some admin tried to ban the chatroom owner
      this.logger.warn(
        `User with uid= ${userToBanId} tried to ban the chatroom owner on room: "${room.name}"`,
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
      `User with uid= ${userToBanId} was banned from room "${room.name}"`,
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
      `User with uid= ${userToUnbanId} was unbanned from room "${room.name}"`,
    );
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
      userId: userToMuteId,
      roomId: room.id,
    });

    this.logger.debug(
      `User with uid= ${userToMuteId} is now muted on room: "${room.name}"`,
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
      this.logger.debug(`User with uid= ${userToUnmuteId} is now unmuted`);
    } else {
      this.logger.debug(`User with uid= ${userToUnmuteId} is not muted`);
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
      `User with uid= ${userIdToRemoveRole} is no longer an admin in room "${room.name}"`,
    );
  }

  //////////////////
  // ? Finders ? //
  /////////////////

  public async findRoomById(roomId: number): Promise<ChatRoom | null> {
    return await this.chatRoomRepository.findOne({
      where: { id: roomId },
      relations: {
        users: true,
        owner: true,
        admins: true,
        bans: true,
      },
    });
  }

  public async findRoomByName(name: string): Promise<ChatRoom | null> {
    return await this.chatRoomRepository.findOne({
      where: { name: name },
      relations: {
        users: true,
        owner: true,
        admins: true,
        bans: true,
      },
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

  //////////////////
  //  ? Utils ?  //
  /////////////////

  public async isUserInRoom(room: ChatRoom, userId: number): Promise<boolean> {
    return room.users.find((user: User) => {
      user.id == userId;
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

  public async isUserAnAdmin(room: ChatRoom, userId: number): Promise<boolean> {
    return room.admins.find((admin: User) => {
      admin.id == userId;
    })
      ? true
      : false;
  }

  public async isUserMuted(userId: number, roomId: number): Promise<boolean> {
    return this.mutedUsers.findIndex(
      (entry) => entry.userId === userId && entry.roomId === roomId,
    ) !== -1
      ? true
      : false;
  }

  /* Check room name for:
      Length boundaries (4-10)
      Composed only by a-z, A-Z, 0-9 and  _
  */
  public validRoomName(name: string): boolean {
    return (
      name.length < 4 || name.length > 10 || !name.match('^[a-zA-Z0-9_]+$')
    );
  }
}

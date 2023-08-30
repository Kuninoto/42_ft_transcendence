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
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { ChatRoom, DirectMessage, User } from 'src/entity';
import { Repository } from 'typeorm';
import {
  ChatRoomInterface,
  ChatRoomSearchInfo,
  ChatRoomType,
  Chatter,
  ErrorResponse,
  RoomWarning,
  SuccessResponse,
} from 'types';
import { ConnectionGateway } from '../connection/connection.gateway';
import { ConnectionService } from '../connection/connection.service';
import { UsersService } from '../users/users.service';
import { CreateRoomDTO } from './dto/create-room.dto';
import { DirectMessageReceivedDTO } from './dto/direct-message-received.dto';

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
  ) {}

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
    missedDMs.forEach(async (dm: DirectMessage) => {
      const directMessageReceived: DirectMessageReceivedDTO = {
        uniqueId: dm.unique_id,
        author: await this.findChatterInfoByUID(dm.sender.id),
        content: dm.content,
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
      if (!createRoomDto.password) {
        throw new BadRequestException(`A protected room must have a password`);
      }
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

  public async findChatterInfoByUID(userId: number): Promise<Chatter> {
    const user: User = await this.usersService.findUserByUID(userId);

    return {
      id: user.id,
      name: user.name,
      avatar_url: user.avatar_url,
    };
  }

  public async findRoomById(roomId: number): Promise<ChatRoom | null> {
    return await this.chatRoomRepository.findOne({
      where: { id: roomId },
      relations: {
        admins: true,
        bans: true,
        owner: true,
        users: true,
      },
    });
  }

  public async findRoomByName(name: string): Promise<ChatRoom | null> {
    return await this.chatRoomRepository.findOne({
      where: { name: name },
      relations: {
        admins: true,
        bans: true,
        owner: true,
        users: true,
      },
    });
  }

  public async findRoomsByNameProximity(
    meUID: number,
    chatRoomNameQuery: string,
  ): Promise<ChatRoomSearchInfo[]> {
    const chatRooms: ChatRoom[] = await this.chatRoomRepository
      .createQueryBuilder('chat_room')
      .leftJoin('chat_room.owner', 'owner')
      .where('chat_room.name LIKE :roomNameProximity', {
        roomNameProximity: chatRoomNameQuery + '%',
      })
      .andWhere("chat_room.type != 'private'")
      .andWhere((qb): string => {
        const subqueryUserRooms: string = qb
          .subQuery()
          .select('user_room.id')
          .from(ChatRoom, 'user_room')
          .leftJoin('user_room.users', 'user')
          .where('user.id = :meUID', { meUID })
          .getQuery();
        return `chat_room.id NOT IN ${subqueryUserRooms}`;
      })
      .andWhere((qb): string => {
        const subqueryBannedRooms: string = qb
          .subQuery()
          .select('banned_room.id')
          .from(ChatRoom, 'banned_room')
          .leftJoin('banned_room.bans', 'banned_user')
          .where('banned_user.id = :meUID', { meUID })
          .getQuery();
        return `chat_room.id NOT IN ${subqueryBannedRooms}`;
      })
      .getMany();

    const chatRoomSearchInfos: ChatRoomSearchInfo[] = chatRooms.map(
      (room: ChatRoom): ChatRoomSearchInfo => ({
        id: room.id,
        name: room.name,
        protected: room.type === ChatRoomType.PROTECTED ? true : false,
      }),
    );
    return chatRoomSearchInfos;
  }

  public async joinRoom(
    joiningUser: User,
    roomId: number,
    password?: string,
  ): Promise<SuccessResponse | ErrorResponse> {
    const room: ChatRoom | null = await this.findRoomById(roomId);
    if (!room) {
      throw new NotFoundException(`Room with id=${roomId} doesn't exist`);
    }

    if (this.isUserBannedFromRoom(room, joiningUser.id)) {
      throw new ForbiddenException(`You're banned from room "${room.name}"`);
    }

    if (this.isUserInRoom(room, joiningUser.id)) {
      this.logger.warn(
        `${joiningUser.name} tried to join a room where he's already in (room: "${room.name}")`,
      );
      throw new ConflictException(`You're already in room "${room.name}"`);
    }

    if (room.type === ChatRoomType.PROTECTED) {
      if (password !== room.password) {
        throw new UnauthorizedException(`Wrong password`);
      }
    }

    room.users.push(joiningUser);
    this.chatRoomRepository.save(room);

    this.connectionGateway.sendRoomWarning(room.id, {
      roomId: room.id,
      affectedUID: joiningUser.id,
      warning: `${joiningUser.name} joined the room!`,
      warningType: RoomWarning.JOIN,
    });

    const socketIdOfJoiningUser: string =
      this.connectionService.findSocketIdByUID(joiningUser.id.toString());

    this.connectionGateway.server
      .to(socketIdOfJoiningUser)
      .socketsJoin(`room-${room.id}`);

    this.connectionGateway.sendRefreshUser(
      joiningUser.id,
      socketIdOfJoiningUser,
    );

    return { message: `Successfully joined room "${room.name}"` };
  }

  public async joinUserRooms(client: Socket): Promise<void> {
    const roomsToJoin: ChatRoomInterface[] | null =
      await this.usersService.findChatRoomsWhereUserIs(client.data.userId);

    if (!roomsToJoin) {
      return;
    }

    const roomSocketIds: string[] = roomsToJoin.map(
      (room: ChatRoomInterface): string => 'room-' + room.id,
    );

    client.join(roomSocketIds);
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
      this.logger.warn(
        `UID=${inviterUID} tried to invite a user to a non-existing room`,
      );
      throw new NotFoundException(`Room with id=${roomId} doesn't exist`);
    }

    if (this.isUserInRoom(room, receiverUID)) {
      this.logger.warn(
        `UID=${inviterUID} tried to invite a user to a room that he's already part of`,
      );
      throw new ConflictException(
        `${receiver.name} is already part of the room`,
      );
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
    userToAssignRoleId: number,
    roomId: number,
  ): Promise<SuccessResponse | ErrorResponse> {
    const room: ChatRoom = await this.findRoomById(roomId);

    const userToAssignRole: User | null = await this.usersService.findUserByUID(
      userToAssignRoleId,
    );
    if (!userToAssignRole) {
      this.logger.warn(
        `Owner of room "${room.name}" tried to add admin privileges to a non-existing user`,
      );
      throw new NotFoundException(
        `User with uid=${userToAssignRole} doesn't exist`,
      );
    }

    if (this.isUserAnAdmin(room, userToAssignRoleId)) {
      this.logger.warn(
        `Owner of room "${room.name}" tried to add admin privileges to an admin`,
      );
      throw new ConflictException('User already has admin privileges');
    }

    room.admins.push(userToAssignRole);
    this.chatRoomRepository.save(room);

    this.connectionGateway.sendRoomWarning(room.id, {
      roomId: room.id,
      affectedUID: userToAssignRoleId,
      warning: `${userToAssignRole.name} was promoted to admin!`,
      warningType: RoomWarning.PROMOTED,
    });

    this.logger.log(
      `"${userToAssignRole.name}" is now an admin on room: "${room.name}"`,
    );
    return {
      message: `Succesfully assigned admin privileges to "${userToAssignRole.name}"`,
    };
  }

  public async removeAdminRole(
    userIdToRemoveRole: number,
    roomId: number,
  ): Promise<SuccessResponse | ErrorResponse> {
    const room: ChatRoom = await this.findRoomById(roomId);

    const userToRemoveRole: User | null = await this.usersService.findUserByUID(
      userIdToRemoveRole,
    );
    if (!userToRemoveRole) {
      this.logger.warn(
        `Owner of room "${room.name}" tried to remove admin privileges of a non-existing user`,
      );
      throw new NotFoundException(
        `User with uid=${userIdToRemoveRole} doesn't exist`,
      );
    }

    if (!this.isUserAnAdmin(room, userIdToRemoveRole)) {
      this.logger.warn(
        `Owner of room "${room.name}" tried to remove admin privileges of a non-admin`,
      );
      throw new BadRequestException(
        `User with uid=${userIdToRemoveRole} is not an admin`,
      );
    }

    room.admins = room.admins.filter(
      (user: User): boolean => user.id != userIdToRemoveRole,
    );
    this.chatRoomRepository.save(room);

    this.connectionGateway.sendRoomWarning(room.id, {
      roomId: room.id,
      affectedUID: userIdToRemoveRole,
      warning: `${userToRemoveRole.name} was demoted from admin!`,
      warningType: RoomWarning.DEMOTED,
    });

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
    const room: ChatRoom = await this.findRoomById(roomId);

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

    this.connectionGateway.sendRoomWarning(room.id, {
      roomId: room.id,
      affectedUID: userToBan.id,
      warningType: RoomWarning.BAN,
      warning: `${userToBan.name} was banned!`,
    });

    await this.leaveRoom(room, userToBanId, false);

    this.logger.log(`${userToBan.name} was banned from room "${room.name}"`);
    return {
      message: `Succesfully banned "${userToBan.name}" from room "${room.name}"`,
    };
  }

  public async unbanFromRoom(
    userToUnbanId: number,
    roomId: number,
  ): Promise<SuccessResponse | ErrorResponse> {
    const room: ChatRoom = await this.findRoomById(roomId);

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
    const room: ChatRoom = await this.findRoomById(roomId);

    if (senderId === userToKickId) {
      this.logger.warn(
        `UID= ${senderId} tried to kick himself from room: "${room.name}"`,
      );
      throw new ConflictException('You cannot kick yourself');
    }

    if (!this.isUserInRoom(room, userToKickId)) {
      this.logger.warn(
        `UID= ${senderId} tried to kick a user that isn't part of the requesting room`,
      );
      throw new NotFoundException(
        `User with uid=${userToKickId} isn't on that room`,
      );
    }

    const userToKick: User | null = await this.usersService.findUserByUID(
      userToKickId,
    );
    if (!userToKick) {
      throw new NotFoundException(
        `User with uid=${userToKickId} doesn't exist`,
      );
    }

    this.connectionGateway.sendRoomWarning(room.id, {
      roomId: room.id,
      affectedUID: userToKick.id,
      warningType: RoomWarning.KICK,
      warning: `${userToKick.name} was kicked!`,
    });

    await this.leaveRoom(room, userToKickId, false);

    this.logger.log(`${userToKick.name} was kicked from room "${room.name}"`);
    return {
      message: `Successfully kicked "${userToKick.name}" from room "${room.name}"`,
    };
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
      this.connectionGateway.sendRoomWarning(room.id, {
        roomId: room.id,
        affectedUID: room.owner.id,
        warningType: RoomWarning.OWNER_LEFT,
        warning: 'Owner has left the room',
      });

      this.connectionGateway.server
        .to(`room-${room.id}`)
        .socketsLeave(`room-${room.id}`);

      await this.chatRoomRepository.remove(room);
    } else {
      room.users = room.users.filter(
        (user: User): boolean => user.id != userLeavingId,
      );
      await this.chatRoomRepository.save(room);

      /* In case this function is being used by kickFromRoom or banFromRoom
      emitUserHasLeftTheRoom will be false (they will have their own events) */
      if (emitUserHasLeftTheRoom) {
        const leavingUser: User = await this.usersService.findUserByUID(
          userLeavingId,
        );
        this.connectionGateway.sendRoomWarning(room.id, {
          roomId: room.id,
          affectedUID: leavingUser.id,
          warningType: RoomWarning.LEAVE,
          warning: `${leavingUser.name} has left the room`,
        });
      }

      // Kick userLeaving from chat room
      this.connectionGateway.server
        .to(socketIdOfLeavingUser)
        .socketsLeave(`room-${room.id}`);
    }
  }

  public async muteUser(
    userToMuteId: number,
    durationInMs: number,
    roomId: number,
  ): Promise<SuccessResponse | ErrorResponse> {
    const room: ChatRoom = await this.findRoomById(roomId);

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
    const room: ChatRoom = await this.findRoomById(roomId);

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
      throw new BadRequestException('Room names must be 4-10 chars long');
    }

    // If room name is not composed only by a-z, A-Z, 0-9, _
    if (!name.match('^[a-zA-Z0-9_]+$')) {
      throw new NotAcceptableException(
        'Room names can only be composed by letters (both cases), numbers and underscore',
      );
    }
  }

  public isUserAnAdmin(room: ChatRoom, userId: number): boolean {
    return room.admins.find((admin: User) => admin.id == userId) ? true : false;
  }

  public isUserBannedFromRoom(room: ChatRoom, userId: number): boolean {
    return room.bans.find((user: User) => user.id == userId) ? true : false;
  }

  public isUserInRoom(room: ChatRoom, userId: number): boolean {
    return room.users.find((user: User) => user.id == userId) ? true : false;
  }

  public isUserMuted(userId: number, roomId: number): boolean {
    return this.mutedUsers.findIndex(
      (entry) => entry.userId === userId && entry.roomId === roomId,
    ) !== -1
      ? true
      : false;
  }
}

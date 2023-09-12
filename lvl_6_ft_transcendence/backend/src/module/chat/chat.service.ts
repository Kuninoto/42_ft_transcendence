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
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  ChatRoomInterface,
  ChatRoomSearchInfo,
  ChatRoomType,
  CreateRoomRequest,
  DirectMessageReceivedEvent,
  ErrorResponse,
  MuteDuration,
  RoomInvite,
  RoomWarning,
  SuccessResponse,
  UserBasicProfile,
  UserStatus,
} from 'types';
import { ChatRoomRoles } from 'types/chat/chat-room-roles.enum';
import { ConnectionGateway } from '../connection/connection.gateway';
import { ConnectionService } from '../connection/connection.service';
import { FriendshipsService } from '../friendships/friendships.service';
import { UsersService } from '../users/users.service';
import { RoomInviteMap } from './RoomInviteMap';

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
    private readonly friendshipsService: FriendshipsService,
  ) {}

  private readonly logger: Logger = new Logger(ChatService.name);

  private roomInviteMap: RoomInviteMap = new RoomInviteMap();
  private mutedUsers: { roomId: number; userId: number }[] = [];

  /****************************
   *           DMs            *
   *****************************/

  public async createDirectMessage(
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

  public async sendMissedDirectMessages(
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
    missedDMs.forEach(async (dm: DirectMessage): Promise<void> => {
      const directMessageReceived: DirectMessageReceivedEvent = {
        uniqueId: dm.unique_id,
        author: await this.findChatterInfoByUID(dm.sender.id),
        content: dm.content,
        sentAt: new Date(),
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
    createRoomRequest: CreateRoomRequest,
    owner: User,
  ): Promise<ChatRoom | ErrorResponse> {
    // If room name's already taken
    const room: ChatRoom | null = await this.findRoomByName(
      createRoomRequest.name,
    );
    if (room) {
      this.logger.warn(
        `${owner.name} tried to create a room with already taken name: "${createRoomRequest.name}"`,
      );
      throw new ConflictException('Room name is already taken');
    }

    this.checkForValidRoomName(createRoomRequest.name);

    if (
      createRoomRequest.type !== ChatRoomType.PROTECTED &&
      createRoomRequest.password
    ) {
      this.logger.warn(
        `"${owner.name}" tried to create a ${createRoomRequest.type} room with password`,
      );
      throw new BadRequestException(
        `A ${createRoomRequest.type} room cannot have a password`,
      );
    }

    if (createRoomRequest.type === ChatRoomType.PROTECTED) {
      if (!createRoomRequest.password) {
        throw new BadRequestException(`A protected room must have a password`);
      }
    }

    const newRoom: ChatRoom = this.chatRoomRepository.create(createRoomRequest);

    /* Add the owner to the users in the room,
			to the list of admins,
			and as the owner */
    newRoom.users = [owner];
    newRoom.admins = [owner];
    newRoom.owner = owner;

    const savedRoom: ChatRoom = await this.chatRoomRepository.save(newRoom);

    const ownerSocketId: string | undefined =
      this.connectionService.findSocketIdByUID(owner.id);

    if (ownerSocketId) {
      this.connectionGateway.server
        .to(ownerSocketId)
        .socketsJoin(`room-${savedRoom.id}`);
    }

    return savedRoom;
  }

  public async findChatterInfoByUID(userId: number): Promise<UserBasicProfile> {
    return await this.usersService.findUserBasicProfileByUID(userId);
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
    query: string,
  ): Promise<ChatRoomSearchInfo[]> {
    const chatRooms: ChatRoom[] = await this.chatRoomRepository
      .createQueryBuilder('chat_room')
      .where('chat_room.name LIKE :roomNameProximity', {
        roomNameProximity: query + '%',
      })
      .andWhere('chat_room.type != :privateType', {
        privateType: ChatRoomType.PRIVATE,
      })
      .andWhere((qb: SelectQueryBuilder<ChatRoom>): string => {
        const subqueryUserRooms: string = qb
          .subQuery()
          .select('participant_rooms.id')
          .from(ChatRoom, 'participant_rooms')
          .leftJoin('participant_rooms.users', 'participants')
          .where('participants.id = :meUID', { meUID })
          .getQuery();
        return `chat_room.id NOT IN ${subqueryUserRooms}`;
      })
      .andWhere((qb: SelectQueryBuilder<ChatRoom>): string => {
        const subqueryBannedRooms: string = qb
          .subQuery()
          .select('banned_rooms.id')
          .from(ChatRoom, 'banned_rooms')
          .leftJoin('banned_rooms.bans', 'banned_user')
          .where('banned_user.id = :meUID', { meUID })
          .getQuery();
        return `chat_room.id NOT IN ${subqueryBannedRooms}`;
      })
      .getMany();

    const chatRoomSearchInfos: ChatRoomSearchInfo[] = chatRooms.map(
      (room: ChatRoom): ChatRoomSearchInfo => ({
        id: room.id,
        name: room.name,
        protected: room.type === ChatRoomType.PROTECTED,
      }),
    );
    return chatRoomSearchInfos;
  }

  public async findPossibleInvites(
    meUser: User,
    friendUID: number,
  ): Promise<ChatRoomInterface[] | ErrorResponse> {
    const friend: User | null = await this.usersService.findUserByUID(
      friendUID,
    );
    if (!friend) {
      throw new NotFoundException(
        `Friend (user) not found`,
      );
    }

    const possibleRoomsToInvite: ChatRoom[] = meUser.chat_rooms.filter(
      (room: ChatRoom): boolean =>
        !friend.chat_rooms.some(
          (friendRoom: ChatRoom): boolean => friendRoom.id === room.id,
        ) &&
        !friend.banned_rooms.some(
          (friendBannedRoom: ChatRoom): boolean =>
            friendBannedRoom.id === room.id,
        ),
    );

    return possibleRoomsToInvite.map(
      (room: ChatRoom): ChatRoomInterface => ({
        id: room.id,
        name: room.name,
        type: room.type,
        ownerId: room.owner.id,
        participants: room.users.map(
          (user: User): UserBasicProfile => ({
            id: user.id,
            name: user.name,
            avatar_url: user.avatar_url,
          }),
        ),
      }),
    );
  }

  public findRoleOnChatRoom(room: ChatRoom, uid: number): ChatRoomRoles | null {
    if (room.owner.id == uid) return ChatRoomRoles.OWNER;
    if (this.isUserAnAdmin(room, uid)) return ChatRoomRoles.ADMIN;
    if (this.isUserInRoom(room, uid)) return ChatRoomRoles.CHATTER;
    return null;
  }

  public async joinRoom(
    joiningUser: User,
    roomId: number,
    password?: string,
  ): Promise<SuccessResponse | ErrorResponse> {
    const room: ChatRoom | null = await this.findRoomById(roomId);
    if (!room)
      throw new NotFoundException(`Room doesn't exist`);

    if (room.type === ChatRoomType.PRIVATE)
      throw new ForbiddenException('Private rooms are only joinable by invite');

    if (this.isUserBannedFromRoom(room, joiningUser.id))
      throw new ForbiddenException(`You're banned from room "${room.name}"`);

    if (this.isUserInRoom(room, joiningUser.id)) {
      this.logger.warn(
        `"${joiningUser.name}" tried to join a room where he's already in (room: "${room.name}")`,
      );
      throw new ConflictException(`You're already in room "${room.name}"`);
    }

    if (room.type === ChatRoomType.PROTECTED && password !== room.password) {
      throw new UnauthorizedException(`Wrong password`);
    }

    room.users.push(joiningUser);
    await this.chatRoomRepository.save(room);

    this.connectionGateway.sendRoomWarning(room.id, {
      roomId: room.id,
      affectedUID: joiningUser.id,
      warning: `${joiningUser.name} joined the room`,
      warningType: RoomWarning.JOIN,
    });

    this.connectionGateway.joinUserToChatRoom(room.id, joiningUser.id);

    return { message: `Successfully joined room "${room.name}"` };
  }

  public async joinUserRooms(client: Socket): Promise<void> {
    const roomsToJoin: ChatRoomInterface[] | null =
      await this.usersService.findChatRoomsWhereUserIs(client.data.userId);

    if (!roomsToJoin) return;

    const roomSocketIds: string[] = roomsToJoin.map(
      (room: ChatRoomInterface): string => 'room-' + room.id,
    );

    client.join(roomSocketIds);
  }

  public async sendRoomInvite(
    inviterUID: number,
    receiverUID: number,
    roomId: number,
  ): Promise<SuccessResponse | ErrorResponse> {
    const receiver: User | null = await this.usersService.findUserByUID(
      receiverUID,
    );
    if (!receiver)
      throw new NotFoundException(`User doesn't exist`);

    if (receiver.status !== UserStatus.ONLINE)
      throw new ConflictException(
        `You cannot invite user because he is ${receiver.status}`,
      );

    if (
      !(await this.friendshipsService.areTheyFriends(inviterUID, receiverUID))
    ) {
      throw new ForbiddenException('You cannot invite non-friends to rooms');
    }

    if (
      this.hasSenderAlreadySentRoomInviteToThisReceiver(
        inviterUID,
        receiverUID,
        roomId,
      )
    )
      throw new ConflictException(
        'You have an active room invite to that user',
      );

    const room: ChatRoom | null = await this.findRoomById(roomId);
    if (!room) {
      this.logger.warn(
        `UID=${inviterUID} tried to invite a user to a non-existing room`,
      );
      throw new NotFoundException(`Room doesn't exist`);
    }

    if (this.isUserInRoom(room, receiverUID)) {
      this.logger.warn(
        `UID=${inviterUID} tried to invite a user to a room that he's already part of`,
      );
      throw new ConflictException(
        `${receiver.name} is already part of the room`,
      );
    }

    const inviteId: string = this.roomInviteMap.createRoomInvite({
      roomId: roomId,
      inviterUID: inviterUID,
      receiverUID: receiverUID,
    });

    this.connectionGateway.sendRoomInviteReceived(receiverUID, {
      inviteId: inviteId,
      inviterUID: inviterUID,
      roomName: room.name,
    });

    return { message: 'Successfully sent room invite' };
  }

  public async respondToRoomInvite(
    inviteId: string,
    accepted: boolean,
    user: User,
  ): Promise<SuccessResponse | ErrorResponse> {
    if (accepted) {
      if (user.status !== UserStatus.ONLINE)
        throw new ConflictException(
          `You cannot accept a room invite while being ${user.status}`,
        );

      return this.joinRoomByInvite(inviteId, user);
    }

    this.roomInviteMap.deleteInviteByInviteId(inviteId);
    return { message: 'Successfully declined chat room invite' };
  }

  public async assignAdminRole(
    sender: User,
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
        `User doesn't exist`,
      );
    }

    if (this.isUserAnAdmin(room, userToAssignRoleId)) {
      this.logger.warn(
        `"${sender.name}" (owner of room "${room.name}") tried to add admin privileges to an admin`,
      );
      throw new ConflictException('User already has admin privileges');
    }

    if (!this.isUserInRoom(room, userToAssignRoleId)) {
      this.logger.warn(
        `"${sender.name}" (owner of room "${room.name}") tried to add admin privileges to a user that isn't part of the current room`,
      );
      throw new BadRequestException(
        `"${userToAssignRole.name}" is not part of the room`,
      );
    }

    room.admins.push(userToAssignRole);
    await this.chatRoomRepository.save(room);

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
      message: `Successfully assigned admin privileges to "${userToAssignRole.name}"`,
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
        `User doesn't exist`,
      );
    }

    if (!this.isUserAnAdmin(room, userIdToRemoveRole)) {
      this.logger.warn(
        `Owner of room "${room.name}" tried to remove admin privileges of a non-admin`,
      );
      throw new BadRequestException(
        `User is not an admin`,
      );
    }

    room.admins = room.admins.filter(
      (user: User): boolean => user.id != userIdToRemoveRole,
    );
    await this.chatRoomRepository.save(room);

    this.connectionGateway.sendRoomWarning(room.id, {
      roomId: room.id,
      affectedUID: userIdToRemoveRole,
      warning: `${userToRemoveRole.name} was demoted from admin!`,
      warningType: RoomWarning.DEMOTED,
    });

    this.logger.log(
      `"${userToRemoveRole.name}" is no longer an admin in room: "${room.name}"`,
    );
    return {
      message: `Successfully removed admin privileges from "${userToRemoveRole.name}" on room "${room.name}"`,
    };
  }

  public async banFromRoom(
    sender: User,
    userToBanId: number,
    roomId: number,
  ): Promise<SuccessResponse | ErrorResponse> {
    const room: ChatRoom = await this.findRoomById(roomId);

    if (sender.id === userToBanId) {
      this.logger.warn(
        `"${sender.name}" tried to ban himself from room "${room.name}"`,
      );
      throw new ConflictException('You cannot ban yourself');
    }

    if (
      room.bans.some(
        (bannedUser: User): boolean => bannedUser.id == userToBanId,
      )
    )
      throw new ConflictException('User is already banned');

    const userToBan: User | null = await this.usersService.findUserByUID(
      userToBanId,
    );
    if (!userToBan)
      throw new NotFoundException(`User doesn't exist`);

    room.bans.push(userToBan);
    await this.chatRoomRepository.save(room);

    this.connectionGateway.sendRoomWarning(room.id, {
      roomId: room.id,
      affectedUID: userToBan.id,
      warningType: RoomWarning.BAN,
      warning: `${userToBan.name} was banned by ${sender.name}!`,
    });

    await this.leaveRoom(room, userToBan, false);

    this.logger.log(`"${userToBan.name}" was banned from room "${room.name}"`);
    return {
      message: `Successfully banned "${userToBan.name}" from room "${room.name}"`,
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
        `User doesn't exist`,
      );
    }

    room.bans = room.bans.filter((user) => user.id != userToUnbanId);
    await this.chatRoomRepository.save(room);

    this.logger.log(
      `"${userToUnban.name}" was unbanned from room "${room.name}"`,
    );
    return {
      message: `Successfully unbanned "${userToUnban.name}" from room "${room.name}"`,
    };
  }

  public async kickFromRoom(
    sender: User,
    userToKickId: number,
    roomId: number,
  ): Promise<SuccessResponse | ErrorResponse> {
    const room: ChatRoom = await this.findRoomById(roomId);

    if (sender.id === userToKickId) {
      this.logger.warn(
        `${sender.name} tried to kick himself from room "${room.name}"`,
      );
      throw new ConflictException('You cannot kick yourself');
    }

    if (!this.isUserInRoom(room, userToKickId)) {
      this.logger.warn(
        `${sender.name} tried to kick a user that isn't part of the createRoomRequesting room`,
      );
      throw new NotFoundException(
        `User isn't on that room`,
      );
    }

    const userToKick: User | null = await this.usersService.findUserByUID(
      userToKickId,
    );
    if (!userToKick) {
      throw new NotFoundException(
        `User doesn't exist`,
      );
    }

    this.connectionGateway.sendRoomWarning(room.id, {
      roomId: room.id,
      affectedUID: userToKick.id,
      warningType: RoomWarning.KICK,
      warning: `${userToKick.name} was kicked by ${sender.name}!`,
    });

    await this.leaveRoom(room, userToKick, false);

    this.logger.log(`"${userToKick.name}" was kicked from room "${room.name}"`);
    return {
      message: `Successfully kicked "${userToKick.name}" from room "${room.name}"`,
    };
  }

  public async leaveRoom(
    room: ChatRoom,
    userLeaving: User,
    emitUserHasLeftTheRoom: boolean,
  ): Promise<void> {
    // If owner is leaving, emit a ownerHasLeftTheRoom event
    // and delete the room from db
    if (userLeaving.id == room.owner.id) {
      // Send the warning that the owner has left
      this.connectionGateway.sendRoomWarning(room.id, {
        roomId: room.id,
        affectedUID: room.owner.id,
        warningType: RoomWarning.OWNER_LEFT,
        warning: `${userLeaving.name} (owner) has left the room`,
      });

      // Remove all participants from the room
      this.connectionGateway.server
        .to(`room-${room.id}`)
        .socketsLeave(`room-${room.id}`);

      await this.chatRoomRepository.remove(room);
    } else {
      // Remove user from chat's table
      this.removeUserFromRoom(room, userLeaving.id);

      /* In case this function is being used by kickFromRoom or banFromRoom
      emitUserHasLeftTheRoom will be false (they will have their own events) */
      if (emitUserHasLeftTheRoom) {
        this.connectionGateway.sendRoomWarning(room.id, {
          roomId: room.id,
          affectedUID: userLeaving.id,
          warningType: RoomWarning.LEAVE,
          warning: `${userLeaving.name} has left the room`,
        });
      }

      const socketIdOfLeavingUser: string =
        this.connectionService.findSocketIdByUID(userLeaving.id);

      // Remove userLeaving from socket room
      this.connectionGateway.server
        .to(socketIdOfLeavingUser)
        .socketsLeave(`room-${room.id}`);
    }
  }

  public async muteUser(
    userToMuteId: number,
    duration: MuteDuration,
    roomId: number,
  ): Promise<SuccessResponse | ErrorResponse> {
    const room: ChatRoom = await this.findRoomById(roomId);

    const userToMute: User | null = await this.usersService.findUserByUID(
      userToMuteId,
    );
    if (!userToMute) {
      throw new NotFoundException(
        `User doesn't exist`,
      );
    }

    if (
      this.mutedUsers.some(
        (mutedUser: { roomId: number; userId: number }): boolean =>
          roomId == mutedUser.roomId && userToMuteId == mutedUser.userId,
      )
    ) {
      throw new ConflictException('User is already muted');
    }

    // Calculate the mute duration in ms to later use on setTimeout()
    let durationInMs: number;
    switch (duration) {
      case MuteDuration.THIRTEEN_SECS:
        durationInMs = 30 * 1000;
        break;
      case MuteDuration.FIVE_MINS:
        durationInMs = 5 * 60 * 1000;
        break;
    }

    this.mutedUsers.push({
      roomId: room.id,
      userId: userToMuteId,
    });

    this.connectionGateway.sendRoomWarning(room.id, {
      roomId: room.id,
      affectedUID: userToMute.id,
      warning: `${userToMute.name} was muted for ${duration}`,
      warningType: RoomWarning.MUTE,
    });

    this.logger.log(
      `"${userToMute.name}" is now muted on room: "${room.name}"`,
    );

    setTimeout(async (): Promise<void> => {
      await this.unmuteUser(userToMuteId, roomId);
    }, durationInMs);

    return { message: `Successfully muted "${userToMute.name}"` };
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
        `User doesn't exist`,
      );
    }

    const indexToRemove: number = this.mutedUsers.findIndex(
      (entry) => entry.userId === userToUnmuteId && entry.roomId === room.id,
    );

    if (indexToRemove !== -1) {
      this.mutedUsers.splice(indexToRemove, 1);
      this.logger.log(
        `"${userToUnmute.name}" was unmuted on room: "${room.name}"`,
      );
    }

    this.connectionGateway.sendRoomWarning(room.id, {
      roomId: room.id,
      affectedUID: userToUnmute.id,
      warning: `${userToUnmute.name} was unmuted`,
      warningType: RoomWarning.UNMUTE,
    });

    return { message: `Successfully unmuted "${userToUnmute.name}"` };
  }

  public async updateRoomPassword(
    newPassword: string,
    roomId: number,
  ): Promise<SuccessResponse | ErrorResponse> {
    const room: ChatRoom = await this.findRoomById(roomId);
    if (room.type === ChatRoomType.PRIVATE)
      throw new ForbiddenException('Private rooms cannot have passwords');

    room.type = ChatRoomType.PROTECTED;
    room.password = newPassword;

    await this.chatRoomRepository.save(room);
    return { message: `Successfully updated room's password` };
  }

  public async removeRoomPassword(
    roomId: number,
  ): Promise<SuccessResponse | ErrorResponse> {
    const room: ChatRoom | null = await this.findRoomById(roomId);
    if (!room)
      throw new NotFoundException(`Room doesn't exist`);

    if (room.type != ChatRoomType.PROTECTED)
      throw new BadRequestException('Room is not protected');

    room.type = ChatRoomType.PUBLIC;
    room.password = null;

    await this.chatRoomRepository.save(room);
    return { message: `Successfully removed room's password` };
  }

  public disconnectChatter(userId: number): void {
    this.roomInviteMap.deleteAllInvitesWithUser(userId);
  }

  public async removeUserFromRoom(room: ChatRoom, uid: number): Promise<void> {
    room.users = room.users.filter((user: User): boolean => user.id != uid);
    room.admins = room.admins.filter((user: User): boolean => user.id != uid);
    await this.chatRoomRepository.save(room);
  }

  public checkForValidRoomName(name: string): void {
    // If room name doesn't respect the boundaries (4-10 chars longs)
    if (!(name.length >= 4 && name.length <= 10))
      throw new BadRequestException('Room names must be 4-10 chars long');

    // If room name is not composed only by a-z, A-Z, 0-9, _
    if (!name.match('^[a-zA-Z0-9_]+$')) {
      throw new NotAcceptableException(
        'Room names can only be composed by letters (both cases), numbers and underscore',
      );
    }
  }

  public isUserAnAdmin(room: ChatRoom, userId: number): boolean {
    return room.admins.find((admin: User): boolean => admin.id == userId)
      ? true
      : false;
  }

  public isUserBannedFromRoom(room: ChatRoom, userId: number): boolean {
    return room.bans.find((user: User): boolean => user.id == userId)
      ? true
      : false;
  }

  public isUserInRoom(room: ChatRoom, userId: number): boolean {
    return room.users.find((user: User): boolean => user.id == userId)
      ? true
      : false;
  }

  public isUserMuted(roomId: number, userId: number): boolean {
    return (
      this.mutedUsers.findIndex(
        (entry: { roomId: number; userId: number }) =>
          entry.userId == userId && entry.roomId == roomId,
      ) !== -1
    );
  }

  // !! NOTE
  // !! BECAUSE INVITES USE MAPS
  // !! IF NESTJS HOT RELOADS ALL INVITES WILL BE LOST
  private async joinRoomByInvite(
    inviteId: string,
    joiningUser: User,
  ): Promise<SuccessResponse | ErrorResponse> {
    const invite: RoomInvite | undefined =
      this.roomInviteMap.findInviteById(inviteId);

    if (!invite) throw new NotFoundException('Invite not found');

    if (invite.receiverUID != joiningUser.id)
      throw new ForbiddenException(`Invite isn't meant for you`);

    const room: ChatRoom | null = await this.findRoomById(invite.roomId);
    if (!room)
      throw new NotFoundException("Room doesn't exist");

    if (this.isUserBannedFromRoom(room, joiningUser.id)) {
      throw new ForbiddenException(`You're banned from room "${room.name}"`);
    }

    if (this.isUserInRoom(room, joiningUser.id)) {
      this.logger.warn(
        `${joiningUser.name} tried to join a room where he's already in (room: "${room.name}")`,
      );
      throw new ConflictException(`You're already in room "${room.name}"`);
    }

    room.users.push(joiningUser);
    await this.chatRoomRepository.save(room);

    this.connectionGateway.sendRoomWarning(room.id, {
      roomId: room.id,
      affectedUID: joiningUser.id,
      warning: `${joiningUser.name} joined the room`,
      warningType: RoomWarning.JOIN,
    });

    this.connectionGateway.joinUserToChatRoom(room.id, joiningUser.id);

    this.roomInviteMap.deleteInviteByInviteId(inviteId);
    return { message: `Successfully joined room "${room.name}"` };
  }

  private hasSenderAlreadySentRoomInviteToThisReceiver(
    senderUID: number,
    receiverUID: number,
    roomId: number,
  ): boolean {
    const invitesWithUser: RoomInvite[] =
      this.roomInviteMap.findAllInvitesWithUser(senderUID);

    invitesWithUser.forEach((invite: RoomInvite): boolean | void => {
      if (
        invite.inviterUID == senderUID &&
        invite.receiverUID == receiverUID &&
        invite.roomId == roomId
      )
        return true;
    });

    return false;
  }
}

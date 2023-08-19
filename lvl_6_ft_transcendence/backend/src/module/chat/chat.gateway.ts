import { Inject, Logger, forwardRef } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GatewayCorsOption } from 'src/common/options/cors.option';
import { User } from 'src/entity/user.entity';
import { FriendshipsService } from 'src/module/friendships/friendships.service';
import { UsersService } from 'src/module/users/users.service';
import { ChatRoom } from 'src/typeorm';
import { ChatRoomMessageI, MuteDuration } from 'types';
import { ConnectionGateway } from '../connection/connection.gateway';
import { ConnectionService } from '../connection/connection.service';
import { AddAdminDTO } from './dto/add-admin.dto';
import { BanFromRoomDTO } from './dto/ban-from-room.dto';
import { CreateRoomDTO } from './dto/create-room.dto';
import { InviteToRoomDTO } from './dto/invite-to-room.dto';
import { JoinRoomDTO } from './dto/join-room.dto';
import { KickFromRoomDTO } from './dto/kick-from-room.dto';
import { MuteUserDTO } from './dto/mute-user.dto';
import { NewChatRoomMessageDTO } from './dto/new-chatroom-message.dto';
import { MessageService } from './message.service';
import { RoomService } from './room.service';

@WebSocketGateway({
  namespace: 'connection',
  cors: GatewayCorsOption,
})
export class ChatGateway implements OnGatewayInit {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly friendshipService: FriendshipsService,
    private readonly roomService: RoomService,
    private readonly messageService: MessageService,
    @Inject(forwardRef(() => ConnectionGateway))
    private readonly connectionGateway: ConnectionGateway,
    @Inject(forwardRef(() => ConnectionService))
    private readonly connectionService: ConnectionService,
  ) {}

  private readonly logger: Logger = new Logger(ChatGateway.name);

  afterInit(server: Server) {
    this.logger.log('Chat-Gateway Initialized');
  }

  /******************************
   *          MESSAGES          *
   ******************************/

  @SubscribeMessage('createRoom')
  async onCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: CreateRoomDTO,
  ): Promise<void> {
    if (await this.roomService.findRoomByName(messageBody.name)) {
      // Room name is already taken
      return;
    }

    this.roomService.createRoom(
      messageBody,
      await this.usersService.findUserByUID(client.data.userId),
    );
    client.join(messageBody.name);
  }

  @SubscribeMessage('joinRoom')
  async onJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: JoinRoomDTO,
  ) {
    if (!this.isValidJoinRoomDTO(messageBody)) {
      this.logger.warn(
        `User with uid= ${client.data.userId} tried to send a wrong JoinRoomDTO`,
      );
      return;
    }

    const room: ChatRoom = await this.roomService.findRoomByName(
      messageBody.name,
    );
    if (!room) {
      this.logger.log(`A room named "${messageBody.name}" doesn't exist`);
      return;
    }

    if (await this.roomService.isUserBannedFromRoom(room, client.data.userId)) {
      this.logger.log(
        `User with uid= ${client.data.userId} is banned from ${messageBody.name}`,
      );
      return;
    }

    const user: User = await this.usersService.findUserByUID(
      client.data.userId,
    );

    const username: string | undefined = user.name;

    this.roomService.joinRoom(room, user);
    client.join(messageBody.name);
    client.to(messageBody.name).emit('joinedRoom', { username });
  }

  @SubscribeMessage('addAdmin')
  public async onAddAdmin(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: AddAdminDTO,
  ) {
    // TODO
    // Only owners can assign admins

    if (!this.isValidAddAdminDTO(messageBody)) {
      this.logger.warn(
        `User with uid= ${client.data.userId} tried to send a wrong AddAdminDTO`,
      );
      return;
    }

    const room: ChatRoom = await this.roomService.findRoomById(
      messageBody.roomId,
    );
    this.logger.debug('room: ' + JSON.stringify(room, null, 2));
    if (!room) {
      this.logger.warn(
        '"' + messageBody.roomId + '" there\'s no room with that ID',
      );
      return;
    }

    if (
      !(await this.roomService.checkIfUserIsAdmin(room, client.data.userId))
    ) {
      this.logger.warn(
        `User with uid= ${messageBody.userId} is not an admin on room: "${room.name}"`,
      );
      return;
    }

    this.roomService.addUserAsAdmin(room, messageBody.userId);
  }

  @SubscribeMessage('kickFromRoom')
  async onKickFromRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: KickFromRoomDTO,
  ): Promise<void> {
    if (!this.isValidKickFromRoomDTO(messageBody)) {
      this.logger.warn(
        `User with uid= ${client.data.userId} tried to send a wrong KickFromRoomDTO`,
      );
      return;
    }

    const room: ChatRoom | null = await this.roomService.findRoomById(
      messageBody.roomId,
    );
    if (!room) {
      this.logger.warn("Room doesn't exist");
      return;
    }

    if (
      !(await this.roomService.checkIfUserIsAdmin(room, client.data.userId))
    ) {
      this.logger.warn(
        `User with uid= ${client.data.userId} is not an admin on room: ${room.name}`,
      );
      return;
    }

    this.roomService.leaveRoom(room, messageBody.userId);
    client.leave(room.name);

    this.logger.debug(
      `User with uid= ${messageBody.userId} kicked from room "${room.name}"`,
    );
  }

  @SubscribeMessage('banFromRoom')
  async onBanFromRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: BanFromRoomDTO,
  ): Promise<void> {
    if (!this.isValidBanFromRoomDTO(messageBody)) {
      this.logger.warn(
        `User with uid= ${client.data.userId} tried to send a wrong BanFromRoomDTO`,
      );
      return;
    }
    const room: ChatRoom | null = await this.roomService.findRoomById(
      messageBody.roomId,
    );
    if (!room) {
      this.logger.warn("Room doesn't exist");
      return;
    }

    if (
      !(await this.roomService.checkIfUserIsAdmin(room, client.data.userId))
    ) {
      this.logger.warn(
        'User with the id: ' +
          client.data.userId +
          'is not an admin on room: ' +
          room.name,
      );
      return;
    }

    this.roomService.leaveRoom(room, messageBody.userId);
    this.roomService.banRoom(room, messageBody.userId);
    client.leave(room.name);
    this.logger.debug(
      'User with id: ' + messageBody.userId + ' banned from ' + room.name,
    );
  }

  @SubscribeMessage('muteUser')
  async onMuteUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: MuteUserDTO,
  ): Promise<void> {
    if (!this.isValidMuteUserDTO(messageBody)) {
      this.logger.warn(
        `User with uid= ${client.data.userId} tried to send a wrong MuteUserDTO`,
      );
      return;
    }

    const room: ChatRoom | null = await this.roomService.findRoomById(
      parseInt(messageBody.roomId),
    );

    if (!room) {
      this.logger.warn("Room doesn't exist");
      return;
    }

    if (
      !(await this.roomService.checkIfUserIsAdmin(room, client.data.userId))
    ) {
      this.logger.warn(
        `User with uid= ${client.data.userId} is not an admin on room: "${room.name}"`,
      );
      return;
    }

    const user = await this.usersService.findUserByUID(
      parseInt(messageBody.userId),
    );
    if (!user) {
      this.logger.debug(
        'User with id: ' + messageBody.userId + "doesn't exist",
      );
      return;
    }

    // Calculate the time duration in ms
    let muteDuration = 0;
    switch (messageBody.duration) {
      case MuteDuration.THIRTEEN_SEGS:
        muteDuration = 30 * 1000;
        break;
      case MuteDuration.FIVE_MINS:
        muteDuration = 5 * 60 * 1000;
        break;
      case MuteDuration.TEN_MIN:
        muteDuration = 10 * 60 * 10000;
        break;
      case MuteDuration.ONE_HOUR:
        muteDuration = 60 * 60 * 1000;
        break;
    }

    this.roomService.muteUser(parseInt(messageBody.userId), muteDuration, room);
    this.logger.log(`${user.name} was muted on room "${room.name}"`);
  }

  @SubscribeMessage('inviteToRoom')
  async onInviteToRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: InviteToRoomDTO,
  ): Promise<void> {
    if (!this.isValidInviteToRoomDTO(messageBody)) {
      this.logger.warn(
        'Client with client id=' +
          client.id +
          ' tried to send a wrong InviteToRoomDTO',
      );
      return;
    }

    const invited: User | null = await this.usersService.findUserByUID(
      parseInt(messageBody.invitedUID),
    );
    if (!invited) {
      // TODO
      // user doesn't exist
      return;
    }

    const invitedSocketId: string = this.connectionService.findSocketIdByUID(
      invited.id.toString(),
    );
    this.connectionGateway.server.to(invitedSocketId).emit('roomInvite', {
      inviterId: client.data.user.id,
      roomName: messageBody.roomName,
    });
  }

  @SubscribeMessage('newChatRoomMessage')
  async onNewChatRoomMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: NewChatRoomMessageDTO,
  ): Promise<void> {
    if (!this.isValidNewChatRoomMessageDTO(messageBody)) {
      this.logger.warn(
        `User with uid= ${client.data.userId} tried to send a wrong NewChatRoomMessageDTO`,
      );
      return;
    }

    const room: ChatRoom | null = await this.roomService.findRoomByName(
      messageBody.roomName,
    );
    if (!room) {
      // TODO implement error response
      throw new Error('Room not found');
    }

    const isUserMuted: boolean = await this.roomService.checkIfUserIsMuted(
      client.data.userId,
      room.id,
    );
    if (isUserMuted) {
      this.logger.log(
        `User with uid= ${client.data.userId} is muted. Message not sent`,
      );
      return;
    }

    const message: ChatRoomMessageI =
      await this.messageService.newChatRoomMessage(
        client.data.userId,
        room,
        messageBody.text,
      );

    const usersInRoom: number[] = room.users.map((user) => user.id);
    usersInRoom.forEach(async (uid) => {
      const blockRelationship: boolean =
        await this.friendshipService.isThereABlockRelationship(
          client.data.userId,
          uid,
        );

      // Retrieve the clientId of the user
      const userSocketId: string = this.connectionService.findSocketIdByUID(
        uid.toString(),
      );
      if (userSocketId && !blockRelationship) {
        client.to(userSocketId).emit('newChatRoomMessage', message);
      }
    });
  }

  /*
		TODO Unban, Unmute, removeFromAdmin
		TODO Passwords
 */

  private isValidJoinRoomDTO(messageBody: any): messageBody is JoinRoomDTO {
    return (
      typeof messageBody === 'object' && typeof messageBody.name === 'string'
    );
  }

  private isValidKickFromRoomDTO(
    messageBody: any,
  ): messageBody is KickFromRoomDTO {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.userId === 'number' &&
      typeof messageBody.roomId === 'number'
    );
  }

  private isValidBanFromRoomDTO(
    messageBody: any,
  ): messageBody is BanFromRoomDTO {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.userId === 'number' &&
      typeof messageBody.roomId === 'number'
    );
  }

  private isValidInviteToRoomDTO(
    messageBody: any,
  ): messageBody is InviteToRoomDTO {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.invitedUID === 'number' &&
      messageBody.invitedUID > 0 &&
      typeof messageBody.roomName === 'string'
    );
  }

  private isValidNewChatRoomMessageDTO(
    messageBody: any,
  ): messageBody is NewChatRoomMessageDTO {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.roomName === 'string' &&
      typeof messageBody.text === 'string'
    );
  }

  private isValidMuteUserDTO(messageBody: any): messageBody is MuteUserDTO {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.userId === 'number' &&
      typeof messageBody.roomId === 'number' &&
      typeof messageBody.duration === 'string'
    );
  }

  private isValidAddAdminDTO(messageBody: any): messageBody is AddAdminDTO {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.userId === 'number' &&
      typeof messageBody.roomId === 'number'
    );
  }
}

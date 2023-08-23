import { forwardRef, Inject, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GatewayCorsOption } from 'src/common/option/cors.option';
import { ChatRoom } from 'src/entity';
import { User } from 'src/entity/user.entity';
import { FriendshipsService } from 'src/module/friendships/friendships.service';
import { UsersService } from 'src/module/users/users.service';
import { ChatRoomMessageI, MuteDuration } from 'types';

import { ConnectionGateway } from '../connection/connection.gateway';
import { ConnectionService } from '../connection/connection.service';
import { AddAdminDTO } from './dto/add-admin.dto';
import { BanFromRoomDTO } from './dto/ban-from-room.dto';
import { CreateRoomDTO } from './dto/create-room.dto';
import { InviteToRoomDTO } from './dto/invite-to-room.dto';
import { JoinRoomDTO } from './dto/join-room.dto';
import { KickFromRoomDTO } from './dto/kick-from-room.dto';
import { LeaveRoomDTO } from './dto/leave-room.dto';
import { MuteUserDTO } from './dto/mute-user.dto';
import { NewChatRoomMessageDTO } from './dto/new-chatroom-message.dto';
import { RemoveAdminDTO } from './dto/remove-admin.dto';
import { RemoveRoomPasswordDTO } from './dto/remove-room-password.dto';
import { UnbanFromRoomDTO } from './dto/unban-user-from-room.dto';
import { UnmuteUserDTO } from './dto/unmute-user.dto';
import { UpdateRoomPasswordDTO } from './dto/update-room-password.dto';
import { MessageService } from './message.service';
import { RoomService } from './room.service';

@WebSocketGateway({
  cors: GatewayCorsOption,
  namespace: 'connection',
})
export class ChatGateway implements OnGatewayInit {
  private readonly logger: Logger = new Logger(ChatGateway.name);

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

  /*
		TODO Passwords
 */

  /******************************
   *          MESSAGES          *
   ******************************/

  afterInit(server: Server) {
    this.logger.log('Chat-Gateway Initialized');
  }

  @SubscribeMessage('createRoom')
  async onCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: CreateRoomDTO,
  ): Promise<void> {
    if (!this.isValidJoinRoomDTO(messageBody)) {
      this.logger.warn(`${client.data.name} tried to send a wrong JoinRoomDTO`);
      return;
    }

    if (!this.roomService.isValidRoomName(messageBody.name)) {
      this.logger.warn(
        `${client.data.name} tried to create a room with an invalid name: "${messageBody.name}"`,
      );
      return;
    }

    this.roomService.createRoom(
      messageBody,
      await this.usersService.findUserByUID(client.data.userId),
    );
    client.join(messageBody.name);
  }

  @SubscribeMessage('inviteToRoom')
  async onInviteToRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: InviteToRoomDTO,
  ): Promise<void> {
    if (!this.isValidInviteToRoomDTO(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong InviteToRoomDTO`,
      );
      return;
    }

    const invited: null | User = await this.usersService.findUserByUID(
      messageBody.invitedUID,
    );
    if (!invited) {
      this.logger.warn(
        `${client.data.name} tried to invite a non-existing user to room: "${messageBody.roomName}"`,
      );
      return;
    }

    const invitedSocketId: string | undefined =
      this.connectionService.findSocketIdByUID(invited.id.toString());

    if (invitedSocketId) {
      this.connectionGateway.server.to(invitedSocketId).emit('roomInvite', {
        inviterId: client.data.userId,
        roomName: messageBody.roomName,
      });
    }
  }

  @SubscribeMessage('joinRoom')
  async onJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: JoinRoomDTO,
  ) {
    if (!this.isValidJoinRoomDTO(messageBody)) {
      this.logger.warn(`${client.data.name} tried to send a wrong JoinRoomDTO`);
      return;
    }

    const room: ChatRoom | null = await this.roomService.findRoomById(
      messageBody.roomId,
    );
    if (!room) {
      this.logger.log(`A room with id= "${messageBody.roomId}" doesn't exist`);
      return;
    }

    const user: null | User = await this.usersService.findUserByUID(
      client.data.userId,
    );

    this.roomService.joinRoom(client.data.userId, user, room);
  }

  @SubscribeMessage('leaveRoom')
  async onLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: LeaveRoomDTO,
  ) {
    if (!this.isValidLeaveRoomDTO(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong LeaveRoomDTO`,
      );
      return;
    }

    const room: ChatRoom | null = await this.roomService.findRoomById(
      messageBody.roomId,
    );
    if (!room) {
      this.logger.warn(
        `${client.data.name} tried to leave a non-existing room`,
      );
      return;
    }

    this.roomService.leaveRoom(room, messageBody.userId, true);
  }

  @SubscribeMessage('kickFromRoom')
  async onKickFromRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: KickFromRoomDTO,
  ): Promise<void> {
    if (!this.isValidKickFromRoomDTO(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong KickFromRoomDTO`,
      );
      return;
    }

    const room: ChatRoom | null = await this.roomService.findRoomById(
      messageBody.roomId,
    );

    if (client.data.userId == messageBody.userId) {
      this.logger.warn(
        `${client.data.name} tried to kick himself from room: ${room.name}`,
      );
      return;
    }

    if (!room) {
      this.logger.warn(
        `${client.data.name} tried to kick someone from a non-existing room`,
      );
      return;
    }

    this.roomService.kickFromRoom(room, messageBody.userId);
  }

  @SubscribeMessage('newChatRoomMessage')
  async onNewChatRoomMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: NewChatRoomMessageDTO,
  ): Promise<void> {
    if (!this.isValidNewChatRoomMessageDTO(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong NewChatRoomMessageDTO`,
      );
      return;
    }

    const room: ChatRoom | null = await this.roomService.findRoomByName(
      messageBody.roomName,
    );
    if (!room) {
      this.logger.warn(
        `${client.data.name} tried to send a message to a non-existing room`,
      );
      return;
    }

    const isUserMuted: boolean = await this.roomService.isUserMuted(
      client.data.userId,
      room.id,
    );
    if (isUserMuted) {
      this.logger.log(`${client.data.name} is muted. Message not sent`);
      return;
    }

    const message: ChatRoomMessageI =
      await this.messageService.newChatRoomMessage(
        client.data.userId,
        room,
        messageBody.text,
      );

    const idsOfUsersInRoom: number[] = room.users.map((user: User) => user.id);
    idsOfUsersInRoom.forEach(async (uid: number) => {
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

  @SubscribeMessage('addAdmin')
  async onAddAdmin(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: AddAdminDTO,
  ) {
    if (!this.isValidAddAdminDTO(messageBody)) {
      this.logger.warn(`${client.data.name} tried to send a wrong AddAdminDTO`);
      return;
    }

    const room: ChatRoom | null = await this.roomService.findRoomById(
      messageBody.roomId,
    );
    if (!room) {
      this.logger.warn(`There's no room with id= ${messageBody.roomId}`);
      return;
    }

    if (!(await this.roomService.isUserAnAdmin(room, client.data.userId))) {
      this.logger.warn(
        `UID= ${messageBody.userId} is not an admin on room: "${room.name}"`,
      );
      return;
    }

    this.roomService.assignAdminRole(room, messageBody.userId);
  }

  @SubscribeMessage('removeAdmin')
  async onRemoveAdmin(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: RemoveAdminDTO,
  ) {
    if (!this.isValidRemoveAdminDTO(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong removeAdminDTO`,
      );
      return;
    }

    const room: ChatRoom | null = await this.roomService.findRoomById(
      messageBody.roomId,
    );
    if (!room) {
      this.logger.warn(`There's no room with id= ${messageBody.roomId}`);
      return;
    }

    if (!(await this.roomService.isUserAnAdmin(room, client.data.userId))) {
      this.logger.warn(
        `UID= ${messageBody.userId} is not an admin on room: "${room.name}"`,
      );
      return;
    }

    /* If the requesting user is not the owner he cannot make changes
    on the admin list */
    if (room.owner.id != client.data.userId) {
      this.logger.debug(
        `${client.data.name} tried to remove an admin role but he's not the owner of the room: "${room.name}"`,
      );
      return;
    }

    this.roomService.removeAdminRole(room, messageBody.userId);
  }

  @SubscribeMessage('banFromRoom')
  async onBanFromRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: BanFromRoomDTO,
  ): Promise<void> {
    if (!this.isValidBanFromRoomDTO(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong BanFromRoomDTO`,
      );
      return;
    }
    const room: ChatRoom | null = await this.roomService.findRoomById(
      messageBody.roomId,
    );

    if (!room) {
      this.logger.warn(
        `${client.data.name} tried to ban someone from a non-existing room`,
      );
      return;
    }

    this.roomService.banFromRoom(client.data.userId, messageBody.userId, room);
  }

  @SubscribeMessage('unbanFromRoom')
  async onUnbanFromRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: UnbanFromRoomDTO,
  ): Promise<void> {
    if (!this.isValidUnbanFromRoomDTO(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong UnbanFromRoomDTO`,
      );
      return;
    }

    const room: ChatRoom | null = await this.roomService.findRoomById(
      messageBody.roomId,
    );

    if (!room) {
      this.logger.warn(
        `${client.data.name} tried to unban someone on a non-existing room`,
      );
      return;
    }

    this.roomService.unbanFromRoom(
      client.data.userId,
      messageBody.userId,
      room,
    );
  }

  @SubscribeMessage('muteUser')
  async onMuteUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: MuteUserDTO,
  ): Promise<void> {
    if (!this.isValidMuteUserDTO(messageBody)) {
      this.logger.warn(`${client.data.name} tried to send a wrong MuteUserDTO`);
      return;
    }

    const room: ChatRoom | null = await this.roomService.findRoomById(
      messageBody.roomId,
    );

    if (!room) {
      this.logger.warn(
        `${client.data.name} tried to mute someone on a non-existing room`,
      );
      return;
    }

    // Calculate the mute duration in ms to later use on setTimeout()
    let muteDuration: number;
    switch (messageBody.duration) {
      case MuteDuration.THIRTEEN_SEGS:
        muteDuration = 30 * 1000;
        break;
      case MuteDuration.FIVE_MINS:
        muteDuration = 5 * 60 * 1000;
        break;
    }

    this.roomService.muteUser(
      client.data.userId,
      messageBody.userId,
      muteDuration,
      room,
    );

    this.logger.log(
      `UID= ${messageBody.userId} was muted on room "${room.name}"`,
    );
  }

  @SubscribeMessage('unmuteUser')
  async onUnmuteUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: UnmuteUserDTO,
  ): Promise<void> {
    if (!this.isValidUnmuteUserDTO(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong UnmuteUserDTO`,
      );
      return;
    }

    const room: ChatRoom | null = await this.roomService.findRoomById(
      messageBody.roomId,
    );

    if (!room) {
      this.logger.warn(
        `${client.data.name} tried to unmute someone on a non-existing room`,
      );
      return;
    }

    this.roomService.unmuteUser(client.data.userId, messageBody.userId, room);
    this.logger.log(
      `UID= ${messageBody.userId} was unmuted on room "${room.name}"`,
    );
  }

  @SubscribeMessage('updateRoomPassword')
  async onUpdateRoomPassword(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: UpdateRoomPasswordDTO,
  ): Promise<void> {
    if (!this.isValidUpdateRoomPasswordDTO(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong UpdateRoomPasswordDTO`,
      );
      return;
    }

    const room: ChatRoom | null = await this.roomService.findRoomById(
      messageBody.roomId,
    );

    if (!room) {
      this.logger.warn(`There's no room with id= ${messageBody.roomId}`);
      return;
    }

    this.roomService.updateRoomPassword(
      client.data.userId,
      messageBody.newPassword,
      room,
    );
  }

  @SubscribeMessage('removeRoomPassword')
  async onRemoveRoomPassword(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: RemoveRoomPasswordDTO,
  ) {
    if (!this.isValidRemoveRoomPasswordDTO(messageBody)) {
      this.logger.warn(
        `${client.data.name} tried to send a wrong RemoveRoomPasswordDTO`,
      );
      return;
    }

    const room: ChatRoom | null = await this.roomService.findRoomById(
      messageBody.roomId,
    );

    if (!room) {
      this.logger.warn(`There's no room with id= ${messageBody.roomId}`);
      return;
    }

    this.roomService.removeRoomPassword(client.data.userId, room);
  }

  private isValidAddAdminDTO(messageBody: any): messageBody is AddAdminDTO {
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

  private isValidLeaveRoomDTO(messageBody: any): messageBody is LeaveRoomDTO {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.userId === 'number' &&
      typeof messageBody.roomId === 'number'
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

  private isValidNewChatRoomMessageDTO(
    messageBody: any,
  ): messageBody is NewChatRoomMessageDTO {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.roomName === 'string' &&
      typeof messageBody.text === 'string'
    );
  }

  private isValidRemoveAdminDTO(
    messageBody: any,
  ): messageBody is RemoveAdminDTO {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.userId === 'number' &&
      typeof messageBody.roomId === 'number'
    );
  }

  private isValidRemoveRoomPasswordDTO(
    messageBody: any,
  ): messageBody is RemoveRoomPasswordDTO {
    return (
      typeof messageBody === 'object' && typeof messageBody.roomId === 'number'
    );
  }

  private isValidUnbanFromRoomDTO(
    messageBody: any,
  ): messageBody is UnbanFromRoomDTO {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.userId === 'number' &&
      typeof messageBody.roomId === 'number'
    );
  }

  private isValidUnmuteUserDTO(messageBody: any): messageBody is UnmuteUserDTO {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.userId === 'number' &&
      typeof messageBody.roomId === 'number'
    );
  }

  private isValidUpdateRoomPasswordDTO(
    messageBody: any,
  ): messageBody is UpdateRoomPasswordDTO {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.roomId === 'number' &&
      typeof messageBody.newPassword === 'string'
    );
  }
}

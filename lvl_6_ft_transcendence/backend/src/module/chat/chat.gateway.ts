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
import { ChatRoomMessageI } from 'src/common/types/chat-room-message.interface';
import { User } from 'src/entity/user.entity';
import { FriendshipsService } from 'src/module/friendships/friendships.service';
import { UsersService } from 'src/module/users/users.service';
import { ChatRoom } from 'src/typeorm';
import { ConnectionGateway } from '../connection/connection.gateway';
import { ConnectionService } from '../connection/connection.service';
import { CreateRoomDTO } from './dto/create-room.dto';
import { InviteToRoomDTO } from './dto/invite-to-room.dto';
import { JoinRoomDTO } from './dto/join-room.dto';
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

    this.roomService.createRoom(messageBody, client.data.user);
    client.join(messageBody.name);
  }

  @SubscribeMessage('joinRoom')
  async onJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: JoinRoomDTO,
  ) {
    if (!this.isValidJoinRoomDTO(messageBody)) {
      this.logger.warn(
        'Client with client id=' +
          client.id +
          ' tried to send a wrong JoinRoomDTO',
      );
      return;
    }

    // TODO verify if user is already in room

    if (
      (await this.roomService.findRoomByName(messageBody.roomName)) === null
    ) {
      this.logger.log(
        'A room with "' + messageBody.roomName + '" name doesn\'t exist',
      );
      return;
    }

    const user: User = await this.usersService.findUserByUID(
      client.data.userId,
    );
    const username: string | undefined = user.name;

    this.roomService.joinRoom(messageBody.roomName, user);
    client.join(messageBody.roomName);

    client.to(messageBody.roomName).emit('joinedRoom', { username });
  }

  @SubscribeMessage('inviteToRoom')
  async onInviteToRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() messageBody: InviteToRoomDTO,
  ): Promise<void> {
    if (!this.isValidInviteToRoomDTO(messageBody)) {
      this.logger.warn(
        'Client with socket id=' +
          socket.id +
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
      inviterId: socket.data.user.id,
      roomName: messageBody.roomName,
    });
  }

  @SubscribeMessage('newChatRoomMessage')
  async onNewChatRoomMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() messageBody: NewChatRoomMessageDTO,
  ): Promise<void> {
    if (!this.isValidNewChatRoomMessageDTO(messageBody)) {
      this.logger.warn(
        'Client with socket id=' +
          socket.id +
          ' tried to send a wrong NewChatRoomMessageDTO',
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

    const message: ChatRoomMessageI =
      await this.messageService.newChatRoomMessage(
        socket.data.userId,
        room,
        messageBody.text,
      );

    const usersInRoom: number[] = room.users.map((user) => user.id);

    usersInRoom.forEach(async (uid) => {
      const blockRelationship: boolean =
        await this.friendshipService.isThereABlockRelationship(
          socket.data.userId,
          uid,
        );

      // Retrieve the socketId of the user
      const userSocketId: string =
        this.connectionService.findSocketIdByUID(uid.toString());
      if (userSocketId && !blockRelationship) {
        socket.to(userSocketId).emit('newChatRoomMessage', message);
      }
    });
  }

  /*
    TODO
    Assign Admins (perhaps via controller instead of socket messages)

    Admin functionalities (socket messages)

    Game Invite (I take this one)
 */

  private isValidJoinRoomDTO(messageBody: any): messageBody is JoinRoomDTO {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.roomName === 'string'
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
}

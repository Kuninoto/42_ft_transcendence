import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { corsOption } from 'src/common/options/cors.option';
import { ChatRoomMessageI } from 'src/common/types/chat-room-message.interface';
import { DirectMessageI } from 'src/common/types/direct-message.interface';
import { User } from 'src/entity/user.entity';
import { AuthService } from 'src/module/auth/auth.service';
import { FriendshipsService } from 'src/module/friendships/friendships.service';
import { UsersService } from 'src/module/users/users.service';
import { ChatRoom } from 'src/typeorm';
import { CreateRoomDTO } from './dto/create-room.dto';
import { InviteToRoomDTO } from './dto/invite-to-room.dto';
import { JoinRoomDTO } from './dto/join-room.dto';
import { NewChatRoomMessageDTO } from './dto/new-chatroom-message.dto';
import { OnDirectMessageDTO } from './dto/on-direct-message.dto';
import { MessageService } from './message.service';
import { RoomService } from './room.service';

// The first number defines the socket PORT
// Cross-Origin Resource Sharing (CORS) configures the behavior for the WebSocket gateway.
// origin option defines who can connect to the socket. (i.e., domain or IP address)
// In this case any origin is allowed
// namespace is the url path. ex: localhost:3000/chat
@WebSocketGateway({
  namespace: 'chat',
  cors: corsOption,
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  public server: Server;

  constructor(
    private readonly messageService: MessageService,
    private readonly authService: AuthService,
    private readonly roomService: RoomService,
    private readonly usersService: UsersService,
    private readonly friendshipService: FriendshipsService,
  ) {}

  private readonly logger: Logger = new Logger(ChatGateway.name);

  afterInit(server: Server) {
    this.logger.log('Chat-Gateway Initialized');
  }

  // Check for connection and print the socket id
  async handleConnection(socket: Socket) {
    try {
      // const user: User = await this.authService.authenticateClientAndRetrieveUser(socket);
      const user: User = await this.usersService.findUserByUID(
        Number(socket.handshake.headers.authorization),
      );
      this.usersService.updateSocketIdByUID(user.id, socket.id);

      this.roomService.joinUserRooms(
        socket,
        await this.roomService.findRoomsWhereUserIs(user.id),
      );

      socket.data.user = user;
      this.logger.log(
        '"' + socket.data.user.name + '" connected to the chat socket',
      );
    } catch {
      socket.disconnect();
    }
  }

  // TODO Check for disconnection and print the socket id
  handleDisconnect(socket: Socket) {
    if (!socket.data.user) {
      this.logger.log('Undefined intruder has disconnected');
    } else {
      this.logger.log(socket.data.user.name + ' has disconnected');
      this.usersService.updateSocketIdByUID(socket.data.user.id, null);
    }
  }

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
    @ConnectedSocket() socket: Socket,
    @MessageBody() messageBody: JoinRoomDTO,
  ) {
    if (!this.isValidJoinRoomDTO(messageBody)) {
      this.logger.error(
        'Client with socket id=' +
          socket.id +
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

    this.roomService.joinRoom(messageBody.roomName, socket.data.user);

    const username: string | undefined = socket.data.user.name;

    socket.join(messageBody.roomName);
    socket.to(messageBody.roomName).emit('joinedRoom', { username });
  }

  @SubscribeMessage('inviteToRoom')
  async onInviteToRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() messageBody: InviteToRoomDTO,
  ): Promise<void> {
    if (!this.isValidInviteToRoomDTO(messageBody)) {
      this.logger.error(
        'Client with socket id=' +
          socket.id +
          ' tried to send a wrong InviteToRoomDTO',
      );
      return;
    }

    const invited: User | null = await this.usersService.findUserByUID(
      messageBody.invitedId,
    );
    if (!invited) {
      // TODO
      // user doesn't exist
      return;
    }

    this.server.to(invited.socketId).emit('roomInvite', {
      inviterId: socket.data.user.id,
      roomName: messageBody.roomName,
    });
  }

  @SubscribeMessage('newChatRoomMessage')
  async onNewMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() messageBody: NewChatRoomMessageDTO,
  ): Promise<void> {
    if (!this.isValidNewChatRoomMessageDTO(messageBody)) {
      this.logger.error(
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
        socket.data.user,
        room,
        messageBody.text,
      );

    const usersInRoom: number[] = room.users.map((user) => user.id);

    usersInRoom.forEach(async (uid) => {
      const blockRelationship: boolean =
        await this.friendshipService.isThereABlockRelationship(
          socket.data.user.id,
          uid,
        );

      // Retrieve the socketId of the user
      const userSocketId: string = await this.usersService.findSocketIdbyUID(
        uid,
      );
      if (userSocketId && !blockRelationship) {
        socket.to(userSocketId).emit('newChatRoomMessage', message);
      }
    });
  }

  @SubscribeMessage('newDirectMessage')
  async onNewDirectMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() messageBody: OnDirectMessageDTO,
  ): Promise<void> {
    if (!this.isValidOnDirectMessageDTO(messageBody)) {
      this.logger.error(
        'Client with socket id=' +
          socket.id +
          ' tried to send a wrong OnDirectMessageDTO',
      );
      return;
    }

    if (socket.data.user.id == messageBody.receiverUID) {
      // self message
      return;
    }

    const receiverSocketId: string | null =
      await this.usersService.findSocketIdbyUID(messageBody.receiverUID);

    if (!receiverSocketId) {
      // TODO
      // user is offline or doesn't exist
      return;
    }

    const newDirectMessage: DirectMessageI =
      await this.messageService.newDirectMessage(
        socket.data.user.id,
        messageBody.receiverUID,
        messageBody.text,
      );
    this.server.to(receiverSocketId).emit('newDirectMessage', newDirectMessage);
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
      typeof messageBody.invitedId === 'number' &&
      messageBody.invitedId > 0 &&
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

  private isValidOnDirectMessageDTO(
    messageBody: any,
  ): messageBody is OnDirectMessageDTO {
    return (
      typeof messageBody === 'object' &&
      typeof messageBody.receiverUID === 'number' &&
      typeof messageBody.text === 'string'
    );
  }
}

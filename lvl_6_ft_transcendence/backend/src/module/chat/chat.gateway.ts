import { Inject, Logger, forwardRef } from '@nestjs/common';
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
import { GatewayCorsOption } from 'src/common/options/cors.option';
import { ChatRoomMessageI } from 'src/common/types/chat-room-message.interface';
import { DirectMessageI } from 'src/common/types/direct-message.interface';
import { Achievements } from 'src/entity/achievement.entity';
import { User } from 'src/entity/user.entity';
import { AuthService } from 'src/module/auth/auth.service';
import { FriendshipsService } from 'src/module/friendships/friendships.service';
import { UsersService } from 'src/module/users/users.service';
import { ChatRoom } from 'src/typeorm';
import { GameService } from '../game/game.service';
import { CreateRoomDTO } from './dto/create-room.dto';
import { InviteToRoomDTO } from './dto/invite-to-room.dto';
import { JoinRoomDTO } from './dto/join-room.dto';
import { NewChatRoomMessageDTO } from './dto/new-chatroom-message.dto';
import { OnDirectMessageDTO } from './dto/on-direct-message.dto';
import { MessageService } from './message.service';
import { RoomService } from './room.service';

@WebSocketGateway({
  namespace: 'chat',
  cors: GatewayCorsOption,
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  public server: Server;

  constructor(
    private readonly authService: AuthService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly friendshipService: FriendshipsService,
    private readonly gameService: GameService,
    private readonly roomService: RoomService,
    private readonly messageService: MessageService,
  ) {}

  private readonly logger: Logger = new Logger(ChatGateway.name);

  afterInit(server: Server) {
    this.logger.log('Chat-Gateway Initialized');
  }

  async handleConnection(socket: Socket) {
    try {
      const user: User =
        await this.authService.authenticateClientAndRetrieveUser(socket);
      this.usersService.updateSocketIdByUID(user.id, socket.id);

      this.roomService.joinUserRooms(
        socket,
        await this.usersService.findChatRoomsWhereUserIs(user.id),
      );

      socket.data.userId = user.id;
      this.logger.log(
        '"' + socket.data.user.name + '" connected to the chat socket',
      );
    } catch {
      socket.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    await this.gameService.disconnectPlayer(client.id);
    if (!client.data.userId) {
      this.logger.log('Undefined intruder has disconnected');
    } else {
      this.logger.log(
        'User with id=' + client.data.userId + ' has disconnected',
      );
      this.usersService.updateSocketIdByUID(client.data.userId, null);
    }
  }

  async achievementUnlocked(
    userId: number,
    achievement: Achievements,
  ): Promise<void> {
    const socketId: string = await this.usersService.findSocketIdbyUID(userId);
    this.server
      .to(socketId)
      .emit('achievementUnlocked', { achievement: achievement });
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
    @ConnectedSocket() client: Socket,
    @MessageBody() messageBody: JoinRoomDTO,
  ) {
    if (!this.isValidJoinRoomDTO(messageBody)) {
      this.logger.error(
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
  async onNewChatRoomMessage(
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

    if (socket.data.userId == messageBody.receiverUID) {
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
        socket.data.userId,
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

  // @SubscribeMessage('gameInvite')
  // async onGameInvite(
  //   @ConnectedSocket() socket: Socket,
  //   @MessageBody() messageBody: GameInviteDTO,
  // ): Promise<void> {
  //   /* if (!this.isValidGameInviteDTO(messageBody)) {
  //     this.logger.error(
  //       'Client with socket id=' +
  //         socket.id +
  //         ' tried to send a wrong GameInviteDTO',
  //     );
  //     return;
  //   } */
  //   // Make receiver join the game socket
  //   // and enter the game with the sender
  // }

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

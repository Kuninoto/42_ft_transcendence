import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  BlockedUser,
  ChatRoom,
  DirectMessage,
  Message,
  User,
} from 'src/typeorm';
import { AuthModule } from '../auth/auth.module';
import { FriendshipsModule } from '../friendships/friendships.module';
import { UsersModule } from '../users/users.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { MessageService } from './message.service';
import { RoomService } from './room.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ChatRoom,
      DirectMessage,
      Message,
      BlockedUser,
    ]),
    AuthModule,
    UsersModule,
    FriendshipsModule,
  ],
  providers: [ChatGateway, ChatService, RoomService, MessageService],
  controllers: [ChatController],
})
export class ChatModule {}

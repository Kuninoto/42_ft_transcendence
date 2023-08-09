import { Module } from '@nestjs/common';
import { ChatService } from './chat/service/chat.service';
import { ChatGateway } from './chat/gateway/chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockedUser, ChatRoom, Friendship, User } from 'src/typeorm';
import { Message } from 'src/typeorm';
import { RoomService } from './room/service/room.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { MessageService } from './message/service/message.service';
import { FriendshipsService } from '../friendships/friendships.service';
import { FriendshipsModule } from '../friendships/friendships.module';

@Module({
	imports: [TypeOrmModule.forFeature([ChatRoom, Message, Friendship, BlockedUser, User]), AuthModule, UsersModule, FriendshipsModule],
	providers: [ChatGateway, ChatService, RoomService, MessageService]
})
export class ChatModule {}

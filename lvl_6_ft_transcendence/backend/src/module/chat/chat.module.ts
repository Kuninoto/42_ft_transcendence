import { Module } from '@nestjs/common';
import { ChatService } from './chat/service/chat.service';
import { ChatGateway } from './chat/gateway/chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom } from 'src/typeorm';
import { Message } from 'src/typeorm';
import { RoomService } from './room/service/room.service';
import { UsersService } from '../users/service/users.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { MessageService } from './message/service/message.service';

@Module({
	imports: [TypeOrmModule.forFeature([ChatRoom, Message]), AuthModule, UsersModule],
	providers: [ChatGateway, ChatService, RoomService, MessageService]
})
export class ChatModule {}

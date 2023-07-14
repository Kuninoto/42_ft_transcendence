import { Module } from '@nestjs/common';
import { ChatService } from './chat/chat.service';
import { ChatGateway } from './chat/chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom } from 'src/typeorm';
import { Message } from 'src/typeorm';
import { RoomService } from './room/room/room.service';
import { AuthService } from '../auth/service/auth.service';
import { UsersService } from '../users/service/users.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';


@Module({
	imports: [TypeOrmModule.forFeature([ChatRoom, Message]), AuthModule, UsersModule],
	providers: [ChatGateway, ChatService, RoomService]
})
export class ChatModule {}

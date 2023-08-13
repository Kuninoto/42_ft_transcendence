import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom, DirectMessage, Message } from 'src/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ConnectionModule } from '../connection/connection.module';
import { FriendshipsModule } from '../friendships/friendships.module';
import { GameModule } from '../game/game.module';
import { UsersModule } from '../users/users.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { MessageService } from './message.service';
import { RoomService } from './room.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoom, Message, DirectMessage]),
    forwardRef(() => UsersModule),
    FriendshipsModule,
    forwardRef(() => GameModule),
    forwardRef(() => ConnectionModule),
  ],
  providers: [ChatGateway, ChatService, RoomService, MessageService],
  controllers: [ChatController],
  exports: [ChatGateway, ChatService, RoomService, MessageService],
})
export class ChatModule {}

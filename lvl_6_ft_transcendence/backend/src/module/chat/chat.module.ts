import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom, DirectMessage, Message } from 'src/entity';
import { ConnectionModule } from '../connection/connection.module';
import { FriendshipsModule } from '../friendships/friendships.module';
import { GameModule } from '../game/game.module';
import { UsersModule } from '../users/users.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { MessageService } from './message.service';
import { RoomService } from './room.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoom, Message, DirectMessage]),
    forwardRef(() => UsersModule),
    forwardRef(() => GameModule),
    forwardRef(() => ConnectionModule),
    FriendshipsModule,
  ],
  providers: [ChatGateway, RoomService, MessageService],
  controllers: [ChatController],
  exports: [ChatGateway, RoomService, MessageService],
})
export class ChatModule {}

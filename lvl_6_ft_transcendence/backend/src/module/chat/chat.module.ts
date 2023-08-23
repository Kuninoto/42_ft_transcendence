import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom, DirectMessage } from 'src/entity';
import { ConnectionModule } from '../connection/connection.module';
import { FriendshipsModule } from '../friendships/friendships.module';
import { GameModule } from '../game/game.module';
import { UsersModule } from '../users/users.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { MessageService } from './message.service';
import { RoomService } from './room.service';

@Module({
  controllers: [ChatController],
  exports: [ChatGateway, RoomService, MessageService],
  imports: [
    TypeOrmModule.forFeature([ChatRoom, DirectMessage]),
    forwardRef(() => UsersModule),
    forwardRef(() => GameModule),
    forwardRef(() => ConnectionModule),
    FriendshipsModule,
  ],
  providers: [ChatGateway, RoomService, MessageService],
})
export class ChatModule {}

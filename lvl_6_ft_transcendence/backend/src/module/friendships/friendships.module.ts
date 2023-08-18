import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockedUser, Friendship, User } from 'src/typeorm/index';
import { AchievementModule } from '../achievement/achievement.module';
import { ConnectionModule } from '../connection/connection.module';
import { FriendshipsController } from './friendships.controller';
import { FriendshipsGateway } from './friendships.gateway';
import { FriendshipsService } from './friendships.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Friendship, BlockedUser]),
    forwardRef(() => AchievementModule),
    forwardRef(() => ConnectionModule),
    forwardRef(() => ChatModule),
  ],
  controllers: [FriendshipsController],
  providers: [FriendshipsGateway, FriendshipsService],
  exports: [FriendshipsService],
})
export class FriendshipsModule {}

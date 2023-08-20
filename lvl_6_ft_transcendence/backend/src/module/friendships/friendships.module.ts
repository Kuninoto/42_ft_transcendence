import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockedUser, Friendship, User } from 'src/entity/index';
import { AchievementModule } from '../achievement/achievement.module';
import { ChatModule } from '../chat/chat.module';
import { ConnectionModule } from '../connection/connection.module';
import { FriendshipsController } from './friendships.controller';
import { FriendshipsGateway } from './friendships.gateway';
import { FriendshipsService } from './friendships.service';

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

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockedUser, Friendship, User } from 'src/typeorm/index';
import { AchievementModule } from '../achievement/achievement.module';
import { MessageService } from '../chat/message.service';
import { ConnectionModule } from '../connection/connection.module';
import { FriendshipsController } from './friendships.controller';
import { FriendshipsService } from './friendships.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Friendship, BlockedUser]),
    forwardRef(() => AchievementModule),
    forwardRef(() => ConnectionModule),
  ],
  controllers: [FriendshipsController],
  providers: [FriendshipsService],
  exports: [FriendshipsService],
})
export class FriendshipsModule {}

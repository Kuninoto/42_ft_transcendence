import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameResult, User } from 'src/entity/index';

import { AchievementModule } from '../achievement/achievement.module';
import { FriendshipsModule } from '../friendships/friendships.module';
import { UserStatsModule } from '../user-stats/user-stats.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  exports: [UsersService],
  imports: [
    TypeOrmModule.forFeature([User, GameResult]),
    FriendshipsModule,
    forwardRef(() => AchievementModule),
    UserStatsModule,
  ],
  providers: [UsersService],
})
export class UsersModule {}

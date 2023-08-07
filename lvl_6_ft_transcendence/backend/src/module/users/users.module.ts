import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserStats } from 'src/entity/index';
import { FriendshipsModule } from '../friendships/friendships.module';
import { GameModule } from '../game/game.module';
import { AchievementModule } from '../achievement/achievement.module';
import { UserStatsModule } from '../user-stats/user-stats.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => FriendshipsModule),
    forwardRef(() => GameModule),
    AchievementModule,
    UserStatsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

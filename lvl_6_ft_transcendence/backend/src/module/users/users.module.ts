import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/typeorm/index';
import { AchievementModule } from '../achievement/achievement.module';
import { FriendshipsModule } from '../friendships/friendships.module';
import { GameModule } from '../game/game.module';
import { UserStatsModule } from '../user-stats/user-stats.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => GameModule),
    forwardRef(() => FriendshipsModule),
    AchievementModule,
    UserStatsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserStats } from 'src/entity';

import { AchievementModule } from '../achievement/achievement.module';
import { UserStatsService } from './user-stats.service';

@Module({
  exports: [UserStatsService],
  imports: [
    TypeOrmModule.forFeature([UserStats]),
    forwardRef(() => AchievementModule),
  ],
  providers: [UserStatsService],
})
export class UserStatsModule {}

import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserStats } from 'src/entity';

import { AchievementModule } from '../achievement/achievement.module';
import { UserStatsService } from './user-stats.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserStats]),
    forwardRef(() => AchievementModule),
  ],
  providers: [UserStatsService],
  exports: [UserStatsService],
})
export class UserStatsModule {}

import { Module, forwardRef } from '@nestjs/common';
import { AchievementService } from './achievement.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Achievement } from 'src/entity/achievement.entity';
import { FriendshipsModule } from '../friendships/friendships.module';
import { UserStatsModule } from '../user-stats/user-stats.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Achievement]),
    forwardRef(() => FriendshipsModule),
    UserStatsModule,
  ],
  providers: [AchievementService],
  exports: [AchievementService],
})
export class AchievementModule {}

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Achievement } from 'src/entity/achievement.entity';
import { ConnectionModule } from '../connection/connection.module';
import { FriendshipsModule } from '../friendships/friendships.module';
import { UserStatsModule } from '../user-stats/user-stats.module';
import { AchievementService } from './achievement.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Achievement]),
    forwardRef(() => FriendshipsModule),
    UserStatsModule,
    ConnectionModule,
  ],
  providers: [AchievementService],
  exports: [AchievementService],
})
export class AchievementModule {}

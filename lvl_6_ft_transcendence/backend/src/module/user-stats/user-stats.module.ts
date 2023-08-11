import { Module } from '@nestjs/common';
import { UserStatsService } from './user-stats.service';
import { UserStats } from 'src/entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([UserStats])],
  providers: [UserStatsService],
  exports: [UserStatsService],
})
export class UserStatsModule {}

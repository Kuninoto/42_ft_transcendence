import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserStats } from 'src/typeorm';
import { UserStatsService } from './user-stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserStats])],
  providers: [UserStatsService],
  exports: [UserStatsService],
})
export class UserStatsModule {}

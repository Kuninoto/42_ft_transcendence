import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Achievement } from 'src/entity/achievement.entity';

import { ConnectionModule } from '../connection/connection.module';
import { AchievementService } from './achievement.service';

@Module({
  exports: [AchievementService],
  imports: [
    TypeOrmModule.forFeature([Achievement]),
    forwardRef(() => ConnectionModule),
  ],
  providers: [AchievementService],
})
export class AchievementModule {}

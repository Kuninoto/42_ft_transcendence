import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Achievement } from 'src/entity/achievement.entity';
import { ConnectionModule } from '../connection/connection.module';
import { AchievementService } from './achievement.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Achievement]), 
    forwardRef(() => ConnectionModule)
  ],
  providers: [AchievementService],
  exports: [AchievementService],
})
export class AchievementModule {}

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameResult, UserStats } from 'src/typeorm/index';
import { AchievementModule } from '../achievement/achievement.module';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { ConnectionGateway } from '../connection/connection.gateway';
import { UserStatsModule } from '../user-stats/user-stats.module';
import { UsersModule } from '../users/users.module';
import { GameQueue } from './GameQueue';
import { GameRoomsMap } from './GameRoomsMap';
import { GameEngineService } from './game-engine.service';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameResult]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    forwardRef(() => ConnectionGateway),
    UserStatsModule,
    forwardRef(() => ChatModule),
  ],
  controllers: [GameController],
  providers: [
    GameGateway,
    GameQueue,
    GameRoomsMap,
    GameService,
    GameEngineService,
  ],
  exports: [GameService],
})
export class GameModule {}

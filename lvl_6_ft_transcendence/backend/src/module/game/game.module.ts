import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameResult } from 'src/typeorm/index';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { UserStatsModule } from '../user-stats/user-stats.module';
import { UsersModule } from '../users/users.module';
import { GameQueue } from './GameQueue';
import { GameRoomMap } from './GameRoomMap';
import { GameEngineService } from './game-engine.service';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { ConnectionModule } from '../connection/connection.module';
import { GameInviteMap } from './GameInviteMap';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameResult]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    forwardRef(() => ConnectionModule),
    UserStatsModule,
    forwardRef(() => ChatModule),
  ],
  controllers: [GameController],
  providers: [
    GameGateway,
    GameQueue,
    GameRoomMap,
    GameInviteMap,
    GameService,
    GameEngineService,
  ],
  exports: [GameService],
})
export class GameModule {}

import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameResult } from 'src/entity/index';

import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { ConnectionModule } from '../connection/connection.module';
import { UserStatsModule } from '../user-stats/user-stats.module';
import { UsersModule } from '../users/users.module';
import { GameEngineService } from './game-engine.service';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { GameInviteMap } from './GameInviteMap';
import { GameQueue } from './GameQueue';
import { GameRoomMap } from './GameRoomMap';

@Module({
  controllers: [GameController],
  exports: [GameService],
  imports: [
    TypeOrmModule.forFeature([GameResult]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    forwardRef(() => ConnectionModule),
    UserStatsModule,
    forwardRef(() => ChatModule),
  ],
  providers: [
    GameGateway,
    GameQueue,
    GameRoomMap,
    GameInviteMap,
    GameService,
    GameEngineService,
  ],
})
export class GameModule {}

import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameResult } from 'src/entity/index';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { ConnectionModule } from '../connection/connection.module';
import { FriendshipsModule } from '../friendships/friendships.module';
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
  imports: [
    TypeOrmModule.forFeature([GameResult]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    UserStatsModule,
    forwardRef(() => ChatModule),
    forwardRef(() => ConnectionModule),
    FriendshipsModule,
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

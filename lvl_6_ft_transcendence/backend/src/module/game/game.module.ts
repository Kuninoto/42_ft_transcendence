import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { GameController } from './game.controller';
import { GameQueue } from './GameQueue';
import { ClientIdToUserIdMap } from './ClientIdToUserId';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [GameController],
  providers: [GameQueue, ClientIdToUserIdMap, GameService, GameGateway],
})
export class GameModule {}

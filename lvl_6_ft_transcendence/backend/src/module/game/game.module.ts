import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { AuthModule } from '../auth/auth.module';
import { GameQueue } from './GameQueue';
import { ClientIdToUserIdMap } from './ClientIdToUserId';

@Module({
  imports: [AuthModule],
  controllers: [GameController],
  providers: [GameQueue, ClientIdToUserIdMap, GameService, GameGateway],
})
export class GameModule {}

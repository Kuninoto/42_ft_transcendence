import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { GameController } from './game.controller';
import { GameQueue } from './GameQueue';
import { ClientToUserInfoMap } from './ClientToUserInfoMap';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [GameController],
  providers: [GameQueue, ClientToUserInfoMap, GameService, GameGateway],
})
export class GameModule {}

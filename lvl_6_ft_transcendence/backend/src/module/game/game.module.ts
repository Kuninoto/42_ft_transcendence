import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameRoom, GameInfo } from 'src/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { GameController } from './game.controller';
import { GameQueue } from './GameQueue';
import { ClientIdToClientInfoMap } from './ClientIdToClientInfoMap';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameRoom, GameInfo]),
    AuthModule,
    UsersModule,
  ],
  controllers: [GameController],
  providers: [GameQueue, ClientIdToClientInfoMap, GameService, GameGateway],
})
export class GameModule {}

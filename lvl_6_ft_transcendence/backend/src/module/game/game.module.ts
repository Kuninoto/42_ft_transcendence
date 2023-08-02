import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameResult } from 'src/entity/index';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { GameController } from './game.controller';
import { GameQueue } from './GameQueue';
import { GameRoomsMap } from './GameRoomsMap';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { GameEngineService } from './game-engine.service';

@Module({
  imports: [TypeOrmModule.forFeature([GameResult]), AuthModule, UsersModule],
  controllers: [GameController],
  providers: [GameQueue, GameRoomsMap, GameService, GameGateway, GameEngineService],
})
export class GameModule {}

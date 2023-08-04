import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameResult, UserStats } from 'src/entity/index';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { GameController } from './game.controller';
import { GameQueue } from './GameQueue';
import { GameRoomsMap } from './GameRoomsMap';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { GameEngineService } from './game-engine.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameResult, UserStats]),
    AuthModule,
    forwardRef(() => UsersModule),
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

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameInfo } from 'src/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { GameController } from './game.controller';
import { GameQueue } from './GameQueue';
import { GameRoomsList } from './GameRoomsList';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([GameInfo]), AuthModule, UsersModule],
  controllers: [GameController],
  providers: [GameQueue, GameRoomsList, GameService, GameGateway],
})
export class GameModule {}

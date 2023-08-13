import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { GameModule } from '../game/game.module';
import { UsersModule } from '../users/users.module';
import { ConnectionGateway } from './connection.gateway';

@Module({
  imports: [AuthModule, UsersModule, GameModule, ChatModule],
  providers: [ConnectionGateway],
  exports: [ConnectionGateway],
})
export class ConnectionModule {}

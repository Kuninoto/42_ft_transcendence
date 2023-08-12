import { Module, forwardRef } from '@nestjs/common';
import { AchievementModule } from '../achievement/achievement.module';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { GameModule } from '../game/game.module';
import { UsersModule } from '../users/users.module';
import { ConnectionGateway } from './connection.gateway';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => AchievementModule),
    forwardRef(() => AuthModule),
    GameModule,
    ChatModule,
  ],
  providers: [ConnectionGateway],
  exports: [ConnectionGateway],
})
export class ConnectionModule {}

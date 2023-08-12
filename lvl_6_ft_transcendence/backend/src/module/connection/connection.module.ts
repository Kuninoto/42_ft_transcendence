import { Module, forwardRef } from '@nestjs/common';
import { AchievementModule } from '../achievement/achievement.module';
import { UsersModule } from '../users/users.module';
import { ConnectionGateway } from './connection.gateway';

@Module({
  imports: [forwardRef(() => UsersModule), forwardRef(() => AchievementModule)],
  providers: [ConnectionGateway],
  exports: [ConnectionGateway],
})
export class ConnectionModule {}

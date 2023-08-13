import { Module, forwardRef } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { GameModule } from '../game/game.module';
import { UsersModule } from '../users/users.module';
import { ConnectionGateway } from './connection.gateway';
import { JwtModule } from '@nestjs/jwt';
import { JwtOption } from 'src/common/options/jwt.option';
import { ConnectionService } from './connection.service';
import { User } from 'src/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthStrategy } from '../auth/strategy/jwt-auth.strategy';
import { UserIdToSocketIdMap } from './UserIdToSocketIdMap';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register(JwtOption),
    forwardRef(() => UsersModule),
    GameModule,
    ChatModule,
  ],
  providers: [JwtAuthStrategy, UserIdToSocketIdMap, ConnectionService, ConnectionGateway],
  exports: [ConnectionGateway, ConnectionService],
})
export class ConnectionModule {}

import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtOption } from 'src/common/options/jwt.option';
import { User } from 'src/typeorm';
import { JwtAuthStrategy } from '../auth/strategy/jwt-auth.strategy';
import { ChatModule } from '../chat/chat.module';
import { FriendshipsModule } from '../friendships/friendships.module';
import { GameModule } from '../game/game.module';
import { UsersModule } from '../users/users.module';
import { UserIdToSocketIdMap } from './UserIdToSocketIdMap';
import { ConnectionGateway } from './connection.gateway';
import { ConnectionService } from './connection.service';
import { AuthService } from '../auth/auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register(JwtOption),
    forwardRef(() => UsersModule),
    GameModule,
    ChatModule,
    FriendshipsModule,
  ],
  providers: [
    JwtAuthStrategy,
    UserIdToSocketIdMap,
    ConnectionService,
    ConnectionGateway,
    AuthService,
  ],
  exports: [ConnectionGateway, ConnectionService],
})
export class ConnectionModule {}

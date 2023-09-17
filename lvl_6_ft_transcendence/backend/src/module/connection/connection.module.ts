import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtOptions } from 'src/common/option/jwt.option';
import { User } from 'src/entity';
import { AuthService } from '../auth/auth.service';
import { JwtAuthStrategy } from '../auth/strategy/jwt-auth.strategy';
import { ChatModule } from '../chat/chat.module';
import { FriendshipsModule } from '../friendships/friendships.module';
import { GameModule } from '../game/game.module';
import { UsersModule } from '../users/users.module';
import { ConnectionGateway } from './connection.gateway';
import { ConnectionService } from './connection.service';
import { UserIdToSocketIdMap } from './UserIdToSocketIdMap';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register(JwtOptions),
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

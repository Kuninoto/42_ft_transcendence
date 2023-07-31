import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { UsersModule } from '../users/users.module';
import { FriendshipsModule } from '../friendships/friendships.module';

@Module({
  imports: [UsersModule, FriendshipsModule],
  controllers: [MeController],
})
export class MeModule {}

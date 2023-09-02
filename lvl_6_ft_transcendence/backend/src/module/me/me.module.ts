import { Module } from '@nestjs/common';
import { FriendshipsModule } from '../friendships/friendships.module';
import { UsersModule } from '../users/users.module';
import { MeController } from './me.controller';

@Module({
  imports: [UsersModule, FriendshipsModule],
  controllers: [MeController],
})
export class MeModule {}

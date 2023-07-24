import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import {
  BlockedUser,
  Friendship,
  MatchHistory,
  User,
  UserRecord,
} from 'src/typeorm';
import { FriendshipsService } from '../friendships/friendships.service';
import { FriendshipsModule } from '../friendships/friendships.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BlockedUser,
      MatchHistory,
      UserRecord,
      User,
    ]),
    FriendshipsModule
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

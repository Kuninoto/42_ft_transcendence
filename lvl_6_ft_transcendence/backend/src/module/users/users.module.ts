import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { BlockedUser, Friendship, User } from 'src/typeorm';
import { FriendshipsService } from '../friendships/friendships.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Friendship, BlockedUser])],
  controllers: [UsersController],
  providers: [UsersService, FriendshipsService],
  exports: [UsersService],
})
export class UsersModule {}

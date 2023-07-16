import { Module } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { FriendshipsService } from './friendships.service';
import { FriendshipsController } from './friendships.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Friendship, BlockedUser } from 'src/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User, Friendship, BlockedUser])],
  controllers: [FriendshipsController],
  providers: [UsersService, FriendshipsService],
  exports: [FriendshipsService]
})
export class FriendshipsModule {}

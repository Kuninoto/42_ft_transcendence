import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, FriendRequest, Friendship } from 'src/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User, Friendship, FriendRequest])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

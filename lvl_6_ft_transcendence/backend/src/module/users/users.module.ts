import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { GameResult, User, UserRecord } from 'src/entity/index';
import { FriendshipsModule } from '../friendships/friendships.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRecord, GameResult]),
    forwardRef(() => FriendshipsModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

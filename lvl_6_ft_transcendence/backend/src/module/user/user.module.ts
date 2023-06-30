import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './service/user.service';
import { UserController } from './controller/user.controller';
import { User } from 'src/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User]),],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService]
})
export class UserModule {}

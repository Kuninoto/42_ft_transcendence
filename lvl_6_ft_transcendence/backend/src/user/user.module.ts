import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { User } from 'src/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User]),],
  providers: [UserService],
  controllers: [UserController]
})
export class UserModule {}

import { Module } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { AuthController } from './controller/auth.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [AuthService],
  controllers: [AuthController]
})
export class AuthModule {}

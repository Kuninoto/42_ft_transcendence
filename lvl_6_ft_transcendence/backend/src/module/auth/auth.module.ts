import { Module } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { AuthController } from 'src/module/auth/controller/auth.controller';
import { UsersModule } from 'src/module/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { FortyTwoStrategy } from 'src/module/auth/strategy/FortyTwo.strategy';

@Module({
  imports: [UsersModule, PassportModule.register({ session: true })],
  providers: [AuthService, FortyTwoStrategy],
  controllers: [AuthController],
})
export class AuthModule {}

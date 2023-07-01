import { Module } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { AuthController } from 'src/module/auth/controller/auth.controller';
import { UsersModule } from 'src/module/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { FortyTwoAuthStrategy } from 'src/module/auth/strategy/FortyTwoAuth.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthStrategy } from './strategy/JwtAuth.strategy';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
    }),
    PassportModule.register({ session: true })
  ],
  providers: [AuthService, FortyTwoAuthStrategy, JwtAuthStrategy],
  controllers: [AuthController],
})
export class AuthModule {}

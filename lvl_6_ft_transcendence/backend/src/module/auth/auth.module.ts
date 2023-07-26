import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from 'src/module/auth/auth.controller';
import { PassportModule } from '@nestjs/passport';
import { FortyTwoAuthStrategy } from 'src/module/auth/strategy/fortytwo-auth.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthStrategy } from './strategy/jwt-auth.strategy';
import { SessionSerializer } from './session.serializer';
import { UsersModule } from '../users/users.module';

console.log('JWT_SECRET= ' + process.env.JWT_SECRET);
console.log('JWT_EXPIRES_IN= ' + process.env.JWT_EXPIRES_IN);

@Module({
  imports: [
    PassportModule.register({ session: true }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
    }),
    UsersModule
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    FortyTwoAuthStrategy,
    JwtAuthStrategy,
    SessionSerializer,
  ],
  exports: [AuthService],
})
export class AuthModule {}

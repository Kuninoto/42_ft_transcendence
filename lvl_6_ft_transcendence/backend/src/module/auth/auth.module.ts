import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtOption } from 'src/common/options/jwt.option';
import { AuthController } from 'src/module/auth/auth.controller';
import { FortyTwoAuthStrategy } from 'src/module/auth/strategy/fortytwo-auth.strategy';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { SessionSerializer } from './session.serializer';
import { JwtAuthStrategy } from './strategy/jwt-auth.strategy';
import { twoFactorAuthStrategy } from './strategy/two-factor-auth.strategy';

console.log('JWT_SECRET= ' + process.env.JWT_SECRET);
console.log('JWT_EXPIRES_IN= ' + process.env.JWT_EXPIRES_IN);

@Module({
  imports: [
    PassportModule.register({ session: true }),
    JwtModule.register(JwtOption),
    forwardRef(() => UsersModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    FortyTwoAuthStrategy,
    JwtAuthStrategy,
    twoFactorAuthStrategy,
    SessionSerializer,
  ],
  exports: [AuthService],
})
export class AuthModule {}

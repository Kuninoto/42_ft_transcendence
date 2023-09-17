import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtOptions } from 'src/common/option/jwt.option';
import { AuthController } from 'src/module/auth/auth.controller';
import { FortyTwoAuthStrategy } from 'src/module/auth/strategy/fortytwo-auth.strategy';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { SessionSerializer } from './session.serializer';
import { Authenticate2faCodeStrategy } from './strategy/authenticate-two-factor-auth-code.strategy';
import { JwtAuthStrategy } from './strategy/jwt-auth.strategy';

console.log('JWT_SECRET= ' + process.env.JWT_SECRET);
console.log('JWT_EXPIRES_IN= ' + process.env.JWT_EXPIRES_IN);

@Module({
  imports: [
    PassportModule.register({ session: true }),
    JwtModule.register(JwtOptions),
    forwardRef(() => UsersModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    FortyTwoAuthStrategy,
    JwtAuthStrategy,
    Authenticate2faCodeStrategy,
    SessionSerializer,
  ],
  exports: [AuthService],
})
export class AuthModule {}

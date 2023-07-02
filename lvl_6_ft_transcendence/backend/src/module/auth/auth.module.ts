import { Module } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { AuthController } from 'src/module/auth/controller/auth.controller';
import { UsersModule } from 'src/module/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { FortyTwoAuthStrategy } from 'src/module/auth/strategy/fortytwo-auth.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthStrategy } from './strategy/jwt-auth.strategy';
import { SessionSerializer } from './session.serializer';

console.log("JWT_SECRET= " + process.env.JWT_SECRET);
console.log("JWT_EXPIRES_IN= " + process.env.JWT_EXPIRES_IN);

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ session: true }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
    })
  ],
  providers: [AuthService, FortyTwoAuthStrategy, JwtAuthStrategy, SessionSerializer],
  controllers: [AuthController],
})
export class AuthModule {}

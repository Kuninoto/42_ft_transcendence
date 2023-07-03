import { Module } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { AuthController } from 'src/module/auth/controller/auth.controller';
import { UsersModule } from 'src/module/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { FortyTwoAuthStrategy } from 'src/module/auth/strategy/fortytwo-auth.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthStrategy } from './strategy/jwt-auth.strategy';
import { SessionSerializer } from './session.serializer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from '../users/service/users.service';
import { User } from 'src/typeorm';

console.log("JWT_SECRET= " + process.env.JWT_SECRET);
console.log("JWT_EXPIRES_IN= " + process.env.JWT_EXPIRES_IN);

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ session: true }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
    }),
    UsersModule
  ],
  providers: [AuthService, FortyTwoAuthStrategy, JwtAuthStrategy, SessionSerializer, UsersService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

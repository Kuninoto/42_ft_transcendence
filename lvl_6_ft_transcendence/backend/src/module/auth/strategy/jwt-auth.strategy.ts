import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UsersService } from 'src/module/users/service/users.service';
import { User } from 'src/typeorm';

// JWT Payload
// - User id (which we signed before)
// - Issued at (automatic jwt info)
// - Expiration dates (automatic jwt info)
export interface JwtPayload {
  id: number;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtAuthStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    const user: User | null = await this.usersService.findUserById(payload.id);
    console.log(user);

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}

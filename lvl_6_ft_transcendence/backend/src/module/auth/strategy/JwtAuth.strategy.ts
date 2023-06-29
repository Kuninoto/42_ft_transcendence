import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UsersService } from 'src/module/users/service/users.service';

export interface TokenPayload {
  iat: number;
  exp: number;
  login: string;
  has_2fa: boolean;
  is_2fa_auth?: boolean;
}

export interface Payload {
  login: string;
  access_token: string;
}

@Injectable()
export class JwtAuthStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: TokenPayload) {
    console.log(payload);

    const user = await this.usersService.getUserByName(payload.login);

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}

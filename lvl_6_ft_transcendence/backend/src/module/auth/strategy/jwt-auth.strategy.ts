import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UsersService } from 'src/module/users/service/users.service';

export interface PayloadWithAccessToken {
  id: number;
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

  async validate(payload: PayloadWithAccessToken) {
    const user = await this.usersService.findUserById(payload.id);

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}

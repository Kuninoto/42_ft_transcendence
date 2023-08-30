import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/entity';
import { UsersService } from 'src/module/users/users.service';
import { ErrorResponse } from 'types';

import { TokenPayload } from './jwt-auth.strategy';

@Injectable()
export class twoFactorAuthStrategy extends PassportStrategy(
  Strategy,
  '2faExchange',
) {
  private readonly logger: Logger = new Logger('twoFactorAuthStrategy');

  constructor(private readonly usersService: UsersService) {
    super({
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: TokenPayload): Promise<ErrorResponse | User> {
    const user: null | User = await this.usersService.findUserByUID(payload.id);

    if (!user) {
      this.logger.warn(
        "A request was made with a token refering to a user that doesn't exist",
      );
      throw new UnauthorizedException('Unauthenticated request');
    }

    return user;
  }
}

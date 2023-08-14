import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ErrorResponse } from 'src/common/types/error-response.interface';
import { UsersService } from 'src/module/users/users.service';
import { User } from 'src/typeorm/index';
import { TokenPayload } from './jwt-auth.strategy';

@Injectable()
export class twoFactorAuthStrategy extends PassportStrategy(Strategy, '2fa') {
  private readonly logger: Logger = new Logger('Authenticate2faAuthStrategy');

  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
      ignoreExpiration: false,
    });
  }

  async validate(payload: TokenPayload): Promise<User | ErrorResponse> {
    const user: User | null = await this.usersService.findUserByUID(payload.id);

    if (!user) {
      this.logger.warn(
        "A request was made with a token refering to a user that doesn't exist",
      );
      throw new UnauthorizedException('Unauthenticated request');
    }

    return user;
  }
}

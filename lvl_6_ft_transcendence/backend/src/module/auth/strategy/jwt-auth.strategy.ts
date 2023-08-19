import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/module/users/users.service';
import { User } from 'src/typeorm';
import { ErrorResponse } from 'types';

// JWT Payload
// - User id
// - Has 2 Factor Authentication
// - Is 2 Factor Authenticated (only appears when has_2fa is true)
// - Issued at (automatic jwt info)
// - Expiration dates (automatic jwt info)
export interface TokenPayload {
  id: number;
  has_2fa: boolean;
  is_2fa_authed?: boolean;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtAuthStrategy extends PassportStrategy(Strategy) {
  private readonly logger: Logger = new Logger('JwtAuthStrategy');

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

    // If user doesn't have 2fa or has 2fa and is 2f authenticated, return user
    if (!payload.has_2fa || (payload.has_2fa && payload.is_2fa_authed)) {
      return user;
    } else {
      this.logger.warn(`"${user.name}" has 2FA but is not 2FA authenticated`);
      throw new UnauthorizedException('Unauthenticated request');
    }
  }
}

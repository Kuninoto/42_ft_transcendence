import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UsersService } from 'src/module/users/users.service';
import { User } from 'src/typeorm';

// JWT Payload
// - User id
// - Has 2 Factor Authentication
// - Is 2 Factor Authenticated
// - Issued at (automatic jwt info)
// - Expiration dates (automatic jwt info)
export interface TokenPayload {
  id: number;
  has_2fa: boolean,
  is_2fa_authed?: boolean,
  iat?: number;
  exp?: number;
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

  async validate(payload: TokenPayload) {
    const user: User | null = await this.usersService.findUserByUID(payload.id);
    
    if (!user) {
      throw new UnauthorizedException();
    }

    // if user doesn't have 2fa or has 2fa and is 2f authenticated, return user
    if (!payload.has_2fa || payload.has_2fa && payload.is_2fa_authed) {
      return user;
    } else {
      throw new UnauthorizedException();
    }
  }
}

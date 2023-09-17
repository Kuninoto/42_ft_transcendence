import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/entity';
import { UsersService } from 'src/module/users/users.service';
import { ErrorResponse } from 'types';
import { TokenPayload } from './jwt-auth.strategy';

@Injectable()
export class Authenticate2faCodeStrategy extends PassportStrategy(
  Strategy,
  'Authenticate2faCode',
) {
  private readonly logger: Logger = new Logger(
    Authenticate2faCodeStrategy.name,
  );

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

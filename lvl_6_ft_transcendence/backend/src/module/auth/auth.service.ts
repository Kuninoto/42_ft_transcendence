import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/entity/index';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { TokenPayload } from './strategy/jwt-auth.strategy';
import { UsersService } from '../users/users.service';
import { Socket } from 'socket.io';

export interface twoFactorAuthDTO {
  secret: string;
  otpAuthURL: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  private readonly logger: Logger = new Logger(AuthService.name);

  // Return the signed JWT as access_token
  public login(user: User): { access_token: string } {
    const payload: TokenPayload = {
      id: user.id,
      has_2fa: user.has_2fa,
    };

    this.logger.log('"' + user.name + '" logged in with 42 auth!');
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // Return the signed JWT as access_token
  public authenticate2fa(user: User): { access_token: string } {
    const payload: TokenPayload = {
      id: user.id,
      has_2fa: true,
      is_2fa_authed: true,
    };

    this.logger.log(
      'User "' + user.name + '" authenticated with Google\'s 2FA!',
    );
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // Verifies if the JWT is valid
  public async verify(token: string): Promise<boolean> {
    // verify() throws if the token is invalid
    try {
      await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      return true;
    } catch (error) {
      return false;
    }
  }

  /****************************
   *            2FA            *
   *****************************/

  public async generate2faSecret(): Promise<twoFactorAuthDTO> {
    const secret = authenticator.generateSecret();

    const otpAuthURL = authenticator.keyuri(
      process.env.GOOGLE_AUTH_APP_NAME,
      process.env.GOOGLE_AUTH_APP_NAME,
      secret,
    );

    return {
      secret,
      otpAuthURL,
    };
  }

  public generateQRCodeDataURL(otpAuthURL: string): string {
    return toDataURL(otpAuthURL);
  }

  public is2faCodeValid(
    twoFactorAuthCode: string,
    secret_2fa: string,
  ): boolean {
    return authenticator.verify({
      token: twoFactorAuthCode,
      secret: secret_2fa,
    });
  }

  /****************************
   *     Socket's User Auth    *
   *****************************/

  private async authClientFromAuthToken(token: string): Promise<User | null> {
    // verify() throws if JWT's signature is not valid
    try {
      const payload: TokenPayload = await this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      if (payload.has_2fa && !payload.is_2fa_authed) {
        throw new Error('Unauthorized Client');
      }

      const userId: number = payload.id;

      return this.usersService.findUserByUID(userId);
    } catch (error) {
      return null;
    }
  }

  public async authenticateClientAndRetrieveUID(
    client: Socket,
  ): Promise<number> {
    const authHeader: string | undefined =
      client.handshake.headers.authorization;
    if (!authHeader) {
      throw new Error('Unauthorized client: missing Authorization header');
    }

    // Authentication: Bearer xxxxx
    // Get the token itself (xxxxx) without "Bearer"
    const authToken: string = authHeader.split(' ')[1];

    const user: User | null = await this.authClientFromAuthToken(authToken);

    if (!user) {
      throw new Error('Unauthorized client: unknown');
    }

    return user.id;
  }
}

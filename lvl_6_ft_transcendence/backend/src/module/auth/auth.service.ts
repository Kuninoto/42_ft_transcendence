import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { AccessTokenInterface } from 'src/common/types/access-token-interface.interface';
import { User } from 'src/typeorm/index';
import { LoginDTO } from './dto/login.dto';
import { TokenPayload } from './strategy/jwt-auth.strategy';

export interface twoFactorAuthDTO {
  secret: string;
  otpAuthURL: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  private readonly logger: Logger = new Logger(AuthService.name);

  // Return the signed JWT as access_token
  public login(user: User): LoginDTO {
    const payload: TokenPayload = {
      id: user.id,
      has_2fa: user.has_2fa,
    };

    this.logger.log('"' + user.name + '" logged in with 42 auth!');
    return {
      accessToken: this.jwtService.sign(payload),
      has2fa: user.has_2fa,
    };
  }

  // Return the signed JWT as access_token
  public authenticate2fa(user: User): AccessTokenInterface {
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

  public async generateQRCodeDataURL(otpAuthURL: string): Promise<string> {
    return await toDataURL(otpAuthURL);
  }

  public is2faCodeValid(
    otp: string,
    secret_2fa: string,
  ): boolean {

    return authenticator.verify({
      token: otp,
      secret: secret_2fa,
    });
  }
}

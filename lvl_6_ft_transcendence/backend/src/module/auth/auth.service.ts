import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { AccessTokenInterface } from 'src/common/types/access-token-interface.interface';
import { User } from 'src/typeorm/index';
import { LoginDTO } from './dto/login.dto';
import { OtpInfoDTO } from './dto/otpInfo.dto';
import { TokenPayload } from './strategy/jwt-auth.strategy';

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

  /****************************
   *            2FA            *
   *****************************/

  public async generate2faSecret(): Promise<OtpInfoDTO> {
    const secret: string = authenticator.generateSecret();

    const otpAuthURL: string = authenticator.keyuri(
      process.env.GOOGLE_AUTH_APP_NAME,
      null,
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
    return authenticator.check(otp, secret_2fa);
  }
}

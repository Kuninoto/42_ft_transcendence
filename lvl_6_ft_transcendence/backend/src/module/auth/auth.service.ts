import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { User } from 'src/typeorm';
import { AccessTokenResponse, LoginResponse, SuccessResponse } from 'types';
import { OtpInfoDTO } from './dto/otpInfo.dto';
import { TokenPayload } from './strategy/jwt-auth.strategy';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  private readonly logger: Logger = new Logger(AuthService.name);

  public tokenWhitelist: Map<string, string> = new Map<string, string>();

  // Return the signed JWT as access_token
  public login(user: User): LoginResponse {
    const payload: TokenPayload = {
      id: user.id,
      has_2fa: user.has_2fa,
    };

    const accessToken: string = this.jwtService.sign(payload);

    // Set the new accessToken as the new valid token for user with uid= user.id
    this.tokenWhitelist.set(user.id.toString(), accessToken);

    this.logger.log(`"${user.name}" logged in with 42 auth!`);
    return {
      accessToken: accessToken,
      has2fa: user.has_2fa,
    };
  }

  public logout(userId: number): SuccessResponse {
    this.tokenWhitelist.delete(userId.toString());
    return {
      message: 'Successfully logged out',
    };
  }

  // Return the signed JWT as access_token
  public authenticate2fa(user: User): AccessTokenResponse {
    const payload: TokenPayload = {
      id: user.id,
      has_2fa: true,
      is_2fa_authed: true,
    };

    const accessToken: string = this.jwtService.sign(payload);

    // Set the new accessToken as the new valid token for user with uid= user.id
    this.tokenWhitelist.set(user.id.toString(), accessToken);

    this.logger.log(`"${user.name}" authenticated with Google Authenticator!`);
    return {
      access_token: accessToken,
    };
  }

  /****************************
   *            2FA            *
   *****************************/

  public async generate2faSecret(): Promise<OtpInfoDTO> {
    const secret: string = authenticator.generateSecret();

    const otpAuthURL: string = authenticator.keyuri(
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

  public is2faCodeValid(otp: string, secret_2fa: string): boolean {
    return authenticator.check(otp, secret_2fa);
  }
}

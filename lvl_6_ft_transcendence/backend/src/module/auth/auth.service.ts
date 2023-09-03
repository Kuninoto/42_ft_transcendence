import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { User } from 'src/entity';
import { AccessTokenResponse, LoginResponse, SuccessResponse } from 'types';

import { OtpInfoDTO } from './dto/otpInfo.dto';
import { TokenPayload } from './strategy/jwt-auth.strategy';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);

  public tokenWhitelist: Map<string, string> = new Map<string, string>();

  constructor(private readonly jwtService: JwtService) {}

  // Return the signed JWT
  public login(user: User): LoginResponse {
    const payload: TokenPayload = {
      has_2fa: user.has_2fa,
      id: user.id,
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

  // Return the signed JWT
  public authenticate2fa(user: User): AccessTokenResponse {
    const payload: TokenPayload = {
      has_2fa: true,
      id: user.id,
      is_2fa_authed: true,
    };

    const accessToken: string = this.jwtService.sign(payload);

    // Set the new accessToken as the new valid token for user with uid= user.id
    this.tokenWhitelist.set(user.id.toString(), accessToken);

    this.logger.log(`"${user.name}" authenticated with Google Authenticator!`);
    return {
      accessToken: accessToken,
    };
  }

  public async generate2faSecret(): Promise<OtpInfoDTO> {
    const secret: string = authenticator.generateSecret();

    const otpAuthURL: string = authenticator.keyuri(
      process.env.GOOGLE_AUTH_APP_NAME,
      process.env.GOOGLE_AUTH_APP_NAME,
      secret,
    );

    return {
      otpAuthURL,
      secret,
    };
  }

  public async generateQRCodeDataURL(otpAuthURL: string): Promise<string> {
    return await toDataURL(otpAuthURL);
  }

  public is2faCodeValid(otp: string, secret_2fa: string): boolean {
    return authenticator.check(otp, secret_2fa);
  }

  public logout(userId: number): SuccessResponse {
    this.tokenWhitelist.delete(userId.toString());
    return {
      message: 'Successfully logged out',
    };
  }
}

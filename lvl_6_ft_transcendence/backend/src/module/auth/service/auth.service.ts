import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/typeorm';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { TokenPayload } from '../strategy/jwt-auth.strategy';

export interface twoFactorAuthDTO {
  secret: string,
  otpAuthURL: string
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService
  ) {}

  // Return the signed JWT as access_token
  // Contains:
  //  - id
  //  - has_2fa
  //  - is_auth
  //  - is_2fa_authed
  public login(user: User): { access_token: string } {
    const payload: TokenPayload = {
      id: user.id,
      has_2fa: user.has_2fa,
      is_auth: user.is_auth,
      is_2fa_authed: user.is_2fa_authed
    }
    console.log("login()");
    return {
      access_token: this.jwtService.sign(payload)
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

  public async generate2faSecret(): Promise<twoFactorAuthDTO> {
    const secret = authenticator.generateSecret();

    const otpAuthURL = authenticator.keyuri(
      process.env.GOOGLE_AUTH_APP_NAME,
      process.env.GOOGLE_AUTH_APP_NAME,
      secret
    ); 

    return {
      secret,
      otpAuthURL
    };
  }

  public generateQRCodeDataURL(otpAuthURL: string) {
    return toDataURL(otpAuthURL);
  }

  public is2faCodeValid(_2faCode: string, _2faSecret: string): boolean {
    return authenticator.verify({
      token: _2faCode,
      secret: _2faSecret
    });
  }
}

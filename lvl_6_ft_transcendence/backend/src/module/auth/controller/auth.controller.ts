import { Controller, Req, Res, Body, Get, Post, UseGuards, UnauthorizedException, HttpCode } from '@nestjs/common';
import { AuthService, twoFactorAuthDTO } from '../service/auth.service';
import { FortyTwoAuthGuard } from '../guard/fortytwo-auth.guard';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from 'src/module/users/service/users.service';
import { User } from 'src/typeorm';
import { throws } from 'assert';

/**
 * Guards act as Middleware of validation
 * and also make the user binded to that JWT
 * available at req.user
 */

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}

  /**
   * GET /api/auth/login/
   * 
   * This is the route that the user will visit
   * to authenticate
   */
  @UseGuards(FortyTwoAuthGuard)
  @Get('login')
  public login() {
    return;
  };

  // passport flow
  // request -> guard -> strategy -> session serializer

  // !TODO
  // Figure out how to login with 2fa
  // i.e glue the pieces of the 2fa 
  // with the login
  // JwtAuthGuard checks them both
  // so that could be a good option 

  /**
   * GET /api/auth/login/callback
   * 
   * This is the route that the OAuth2 Provider (42) will
   * call after the user is authenticated
   * @returns JWT's access_token
   */
  @ApiOkResponse({ description: "New user's login access token" })
  @UseGuards(FortyTwoAuthGuard)
  @Get('login/callback')
  public async loginCallback(@Req() req: any): Promise<{ access_token: string }> {
    const jwt: { access_token: string } = this.authService.login(req.user);
    console.log("payload.access_token = " + jwt.access_token);
    return jwt;
  };

  /**
   * GET /api/auth/logout
   * 
   * Logs out the user
   */
  @UseGuards(JwtAuthGuard)
  @Get('logout')
  public logout(@Req() req: any, @Res() res: any): any {
    const userName = req.user.name;

    return req.logOut(() => {
      res.json({
        user: userName,
        message: 'User has been logged out!',
      });
    });
  };

/**
 * 2fa FLOW above the hood
 * 
 * Install Google Authenticator
 * Open the app and scan the QRCode product of POST /api/auth/2fa/generate
 * POST /api/auth/2fa/enable WITH the one-time code to update the user's info on db
 *
 * Side note for life quality: twoFactorAuthCode must be in all glued together
 * even if the code on the app looks like: 123 456 it should be passed as 123456
 */

  /**
   * POST /api/auth/2fa/enable
   * 
   * Enables two factor authentication.
   * Must be called AFTER a POST /api/auth/2fa/generate is made
   * because /generate generates the secret and is the only way
   * for the user to get the one-time codes that he'll need,
   * inclusively here.
   */
  @ApiOkResponse({
    description: "Enable two factor authentication"
  })
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Post('2fa/enable')
  public async enable2fa(
    @Req() req: { user: User },
    @Body() body: { twoFactorAuthCode: string }
  ): Promise<void> {
    const is2faCodeValid = this.authService.is2faCodeValid(body.twoFactorAuthCode, req.user.secret_2fa);
    if (!is2faCodeValid) {
      throw new UnauthorizedException("Wrong authentication code");
    }

    await this.usersService.enable2fa(req.user.id, req.user.secret_2fa);
    this.authService.authenticate2fa(req.user);
  }

  /**
   * POST /api/auth/2fa/disable
   * 
   * Disables two factor authentication.
   */
  @ApiOkResponse({ description: "Disable two factor authentication" })
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Post('2fa/disable')
  public async disable2fa(
    @Req() req: { user: User },
  ): Promise<void> {
    await this.usersService.disable2fa(req.user.id);
  }

  /**
   * POST /api/auth/2fa/generate
   * 
   * Generates a secret, store it 
   * in the user's table and returns
   * a QRCode that, when scanned with
   * Google Authenticator, registers our App;
   * So that later the user can use the one-time
   * codes for 2fa auth.
   * @returns QRCode for Google Authenticator
   */
  @ApiOkResponse({
    description: "Return the QRCode that enables app registration on Google Authenticator"
  })
  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  public async generate2fa(@Res() res: any, @Req() req: { user: User }) {
    const info2fa: twoFactorAuthDTO = await this.authService.generate2faSecret();

    await this.usersService.updateUserById(req.user.id, { secret_2fa: info2fa.secret });

    return res.json(
      await this.authService.generateQRCodeDataURL(info2fa.otpAuthURL),
    );
  }

   /**
   * POST /api/auth/2fa/authenticate
   * 
   * This route serves for 2fa authentication.
   * Validates the Google Authenticator's one-time
   * code and if it is valid, signs a JWT access_token
   * and returns it else throws.
   * @returns JWT's access_token
   */
  @ApiOkResponse({ description: "" })
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @Post('2fa/authenticate')
  public auth2fa(
    @Req() req: { user: User },
    @Body() body: { twoFactorAuthCode: string }
  ): any {
    const isCodeValid = this.authService.is2faCodeValid(
      body.twoFactorAuthCode,
      req.user.secret_2fa,
    );

    if (!isCodeValid) {
      throw new UnauthorizedException('Wrong authentication code');
    }

    return this.authService.authenticate2fa(req.user);
  }
}

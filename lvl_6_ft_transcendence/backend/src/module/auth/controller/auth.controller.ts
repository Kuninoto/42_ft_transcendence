import { Controller, Req, Res, Body, Get, Post, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService, twoFactorAuthDTO } from '../service/auth.service';
import { FortyTwoAuthGuard } from '../guard/fortytwo-auth.guard';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from 'src/module/users/service/users.service';
import { User } from 'src/typeorm';

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
   * @returns access_token
   */
  @ApiOkResponse({ description: "New user's login access token" })
  @UseGuards(FortyTwoAuthGuard)
  @Get('login/callback')
  public async loginCallback(@Req() req: any): Promise<{ access_token: string }> {
    console.log(req.user);
    const jwt: { access_token: string } = this.authService.login(req.user);
    console.log("payload.access_token = " + jwt.access_token);
    return jwt;
  };

  /**
   * GET /api/auth/logout
   * 
   * Logging out the user
   * @returns 
   */
  @UseGuards(JwtAuthGuard)
  @Get('logout')
  public logout(@Req() req: any, @Res() res: any) {
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
   * Enables two factor authentication
   * Must be called AFTER a POST /api/auth/2fa/generate is made
   */
  @UseGuards(JwtAuthGuard)
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
    this.authService.login2fa(req.user);
  }

  /**
   * POST /api/auth/2fa/disable
   * 
   */
  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  public async disable2fa(
    @Req() req: { user: User },
  ): Promise<void> {
    await this.usersService.disable2fa(req.user.id);
  }

  /**
   * POST /api/auth/2fa/generate
   * 
   * This route returns a QRCode that,
   * when read with Google Authenticator,
   * registers our App; so that later
   * the user can use the codes as a 2fa method 
   * @returns QRCode for Google Authenticator
   */
  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  async generate2fa(@Res() res: any, @Req() req: { user: User }) {
    const info2fa: twoFactorAuthDTO = await this.authService.generate2faSecret();

    await this.usersService.updateUserById(req.user.id, { secret_2fa: info2fa.secret });

    return res.json(
      await this.authService.generateQRCodeDataURL(info2fa.otpAuthURL),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/authenticate')
  async auth2fa(@Req() req: { user: User }, @Body() body: { twoFactorAuthCode: string }) {
    const isCodeValid = this.authService.is2faCodeValid(
      body.twoFactorAuthCode,
      req.user.secret_2fa,
    );

    if (!isCodeValid) {
      throw new UnauthorizedException('Wrong authentication code');
    }

    return this.authService.login(req.user);
  }
}

import { Controller, Req, Res, Body, Get, Post, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService, twoFactorAuthDTO } from '../service/auth.service';
import { FortyTwoAuthGuard } from '../guard/fortytwo-auth.guard';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from 'src/module/users/service/users.service';

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
  public logout() {

  };

  // TODO
  /**
   * POST /api/auth/2fa/turn-on
   * 
   * 
   * @returns 
   */
  @UseGuards(JwtAuthGuard)
  @Post('2fa/turn-on')
  public async turnOn2fa(@Req() req: any, @Body() body: any): Promise<void> {
    const is2faCodeValid = this.authService.is2faCodeValid(body._2faAuthCode, req.user._2faSecret);
    if (!is2faCodeValid) {
      throw new UnauthorizedException("Wrong authentication code");
    }

    await this.usersService.enable2fa(req.user.id, req.user.secret_2fa);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  async generate2fa(@Res() res, @Req() req) {
    const info_2fa: twoFactorAuthDTO = await this.authService.generate2faSecret();

    await this.usersService.updateUserById(req.user.id, { secret_2fa: info_2fa.secret });

    return res.json(
      await this.authService.generateQRCodeDataURL(info_2fa.otpAuthURL),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/authenticate')
  async auth2fa(@Req() request, @Body() body) {
    const isCodeValid = this.authService.is2faCodeValid(
      body.twoFactorAuthenticationCode,
      request.user,
    );

    if (!isCodeValid) {
      throw new UnauthorizedException('Wrong authentication code');
    }

    return this.authService.login(request.user);
  }
}

import {
  Controller,
  Req,
  Res,
  Body,
  Get,
  Patch,
  Post,
  UseGuards,
  UnauthorizedException,
  HttpCode,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { AuthService, twoFactorAuthDTO } from './auth.service';
import { FortyTwoAuthGuard } from './guard/fortytwo-auth.guard';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { User } from 'src/entity/index';
import { UsersService } from 'src/module/users/users.service';
import { ErrorResponse } from '../../common/types/error-response.interface';
import { SuccessResponse } from '../../common/types/success-response.interface';
import { UserStatus } from '../../common/types/user-status.enum';

/**
 * Guards act as Middleware of validation
 * and in case they are the JWT ones they
 * also make the user binded to that token
 * available at req.user
 */

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  private readonly logger: Logger = new Logger(AuthController.name);

  // passport flow
  // request -> guard -> strategy -> session serializer

  /**
   * GET /api/auth/login/callback
   *
   * This is the route that the OAuth2 Provider (42)
   * will call (with the code param) after the user
   * is authenticated
   * @returns JWT's access_token
   */
  @ApiOkResponse({ description: 'The access token of the logged in user' })
  @UseGuards(FortyTwoAuthGuard)
  @Get('login/callback')
  public async loginCallback(
    @Req() req: any,
  ): Promise<{ access_token: string }> {
    const jwt: { access_token: string } = this.authService.login(req.user);
    await this.usersService.updateUserStatusByUID(
      req.user.id,
      UserStatus.ONLINE,
    );

    this.logger.log('Issued a jwt = ' + jwt.access_token);
    return jwt;
  }

  /**
   * GET /api/auth/logout
   *
   * Logs out the user
   */
  @ApiOkResponse({ description: 'Logs out the user' })
  @UseGuards(JwtAuthGuard)
  @Get('logout')
  public async logout(@Req() req: any): Promise<SuccessResponse> {
    await this.usersService.updateUserStatusByUID(
      req.user.id,
      UserStatus.OFFLINE,
    );
    this.logger.log('User "' + req.user.name + '" logged out');

    req.logOut(() => {});

    return { message: 'Successfully logged out!' };
  }

  /**
   * 2fa FLOW
   *
   * Install Google Authenticator
   * Open the app and scan the QRCode product of POST /api/auth/2fa/generate
   * POST /api/auth/2fa/enable WITH the one-time code to update the user's info on db
   *
   * Side note for life quality: twoFactorAuthCode must be all glued together
   * even if the code on the app looks like: 123 456 it should be passed as 123456
   */

  /**
   * POST /api/auth/2fa/enable
   *
   * Enables two factor authentication.
   * MUST be called AFTER a POST /api/auth/2fa/generate is made
   * because /generate generates the secret and is the only way
   * for the user to get the OTPs that he'll need, inclusively here.
   */
  @ApiOkResponse({
    description:
      "Enables two factor authentication.\
      \nMUST be called AFTER a POST /api/auth/2fa/generate is made\
      because /generate generates the secret and the QRCode\
      \nand so is the only way for the user to get the OTPs\
      (registering the app on Google Authenticator) that he'll need,\
      \ninclusively here.",
  })
  @ApiBadRequestResponse({ description: 'If the OTP is invalid' })
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @Patch('2fa/enable')
  public async enable2fa(
    @Req() req: { user: User },
    @Body() body: { twoFactorAuthCode: string },
  ): Promise<{ access_token: string } | ErrorResponse> {
    const is2faCodeValid = this.authService.is2faCodeValid(
      body.twoFactorAuthCode,
      req.user.secret_2fa,
    );
    if (!is2faCodeValid) {
      this.logger.error('A request was made with a wrong auth code (2FA)');
      throw new BadRequestException('Wrong authentication code');
    }

    this.logger.log('Enabling 2fa for user "' + req.user.name + '"');
    await this.usersService.enable2fa(req.user.id, req.user.secret_2fa);

    const jwt: { access_token: string } = this.authService.authenticate2fa(
      req.user,
    );

    return jwt;
  }

  /**
   * PATCH /api/auth/2fa/disable
   *
   * Disables two factor authentication.
   */
  @ApiOkResponse({ description: 'Disables two factor authentication' })
  @UseGuards(JwtAuthGuard)
  @Patch('2fa/disable')
  public async disable2fa(
    @Req() req: { user: User },
  ): Promise<SuccessResponse> {
    this.logger.log('Disabling 2fa for "' + req.user.name + '"');

    return await this.usersService.disable2fa(req.user.id);
  }

  /**
   * POST /api/auth/2fa/generate
   *
   * Generates a secret,
   * stores it in the user's table
   * and returns a QRCode that,
   * when scanned with
   * Google Authenticator,
   * registers our App.
   * Later the user can use the OTPs for two factor authentication.
   * @returns QRCode for Google Authenticator app registration
   */
  @ApiOkResponse({
    description:
      'Returns the QRCode that enables app registration on Google Authenticator',
  })
  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  public async generate2faQRCodeAndSecret(
    @Req() req: { user: User },
    @Res() res: any,
  ) {
    const info2fa: twoFactorAuthDTO =
      await this.authService.generate2faSecret();

    await this.usersService.update2faSecretByUID(req.user.id, info2fa.secret);

    return res.json(this.authService.generateQRCodeDataURL(info2fa.otpAuthURL));
  }

  /**
   * POST /api/auth/2fa/authenticate
   *
   * This route serves for 2fa authentication.
   * Validates the Google Authenticator's OTP
   * and if it is valid, signs a JWT and returns it
   * else throws.
   * @returns JWT's access_token
   */
  @ApiOkResponse({
    description:
      'A new access_token that proves that the user is two factor authenticated',
  })
  @ApiUnauthorizedResponse({ description: 'If the OTP is invalid' })
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Post('2fa/authenticate')
  public auth2fa(
    @Req() req: { user: User },
    @Body() body: { twoFactorAuthCode: string },
  ): { access_token: string } | ErrorResponse {
    const isCodeValid = this.authService.is2faCodeValid(
      body.twoFactorAuthCode,
      req.user.secret_2fa,
    );

    if (!isCodeValid) {
      this.logger.error('A request was made with a invalid auth code (2FA)');
      throw new UnauthorizedException('Invalid authentication code');
    }

    return this.authService.authenticate2fa(req.user);
  }
}

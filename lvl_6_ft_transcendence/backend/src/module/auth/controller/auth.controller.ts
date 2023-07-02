import { Controller, Req, Res, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { FortyTwoAuthGuard } from '../guard/fortytwo-auth.guard';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { PayloadWithAccessToken } from '../strategy/jwt-auth.strategy';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // GET /auth/login/callback
  @ApiOkResponse({ description: "New user's login payload (id and JWT access token)" })
  @UseGuards(FortyTwoAuthGuard)
  @Get('login/callback')
  public async loginCallback(@Req() req: any, @Res() res: any): Promise<PayloadWithAccessToken> {

    const payload: PayloadWithAccessToken = this.authService.login(req.user);
    console.log("payload.id = " + payload.id);
    console.log("payload.access_token = " + payload.access_token);
    return payload;
  };

}

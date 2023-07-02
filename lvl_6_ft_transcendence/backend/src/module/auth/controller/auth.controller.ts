import { Controller, Req, Res, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { FortyTwoAuthGuard } from '../guard/fortytwo-auth.guard';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // GET /auth/login/callback
  @ApiOkResponse({ description: "New user's login payload (JWT access token)" })
  @UseGuards(FortyTwoAuthGuard)
  @Get('login/callback')
  public async loginCallback(@Req() req: any): Promise<{ access_token: string }> {

    const payload: { access_token: string } = this.authService.login(req.user);
    console.log("payload.access_token = " + payload.access_token);
    return payload;
  };

}

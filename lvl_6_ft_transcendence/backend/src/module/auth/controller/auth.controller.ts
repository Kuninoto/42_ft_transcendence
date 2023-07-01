import { Controller, Req, Res, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { FortyTwoAuthGuard } from '../guard/fortytwo-auth.guard';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { Payload } from '../strategy/JwtAuth.strategy';
// take in count state equality check

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // GET /auth/login
  @Get('login')
  public login(): void {}

  @UseGuards(FortyTwoAuthGuard)
  @Get('login/callback')
  public async loginCallback(@Req() req: any, @Res() res: any): Promise<Payload> {
    console.log("loginCallback()...");
  
    console.log(req);
    console.log(res);

    const payload = await this.authService.login(req.user);
    return payload;
  };

}

  // GET /auth/:CODE
  //@Get(':CODE')
  //public userAuth(@Param('CODE') codeParam: string) {
  //  return this.authService.userAuth(codeParam);
  //}

import { Controller, Request, Response, Get, Param, Post, Redirect, UseGuards } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { FortyTwoAuthGuard } from '../guard/fortytwo-guard';
// take in count state equality check

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // GET /auth/login
  @UseGuards(FortyTwoAuthGuard) 
  @Get('login')
  public userLogin(@Request() req): any {
    console.log("usr log")
    console.log("req.user = " + req.user);
    // req.user == whatever is returned by validate()
    return req.user;
  }

  // GET /auth/:CODE
  //@Get(':CODE')
  //public userAuth(@Param('CODE') codeParam: string) {
  //  return this.authService.userAuth(codeParam);
  //}
}

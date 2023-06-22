import { Controller, Get, Param, Redirect } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
// take in count state equality check

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/:CODE')
  public userLogin(@Param('CODE') codeParam: string) {
    return this.authService.userLogin(codeParam);
  }
}

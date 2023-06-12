import {
    Controller,
    Get,
    Query,
    Redirect
} from '@nestjs/common';
import { AuthService } from '../service/auth.service';

// take in count state equality check

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Get('login')
  public userLogin(@Query('code') codeParam: string ) {
    return this.authService.userLogin(codeParam);
  }
}

import {
    Controller,
    Get,
    Query
} from '@nestjs/common';
import { AuthService } from '../service/auth.service';

// take in count state equality check

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Get('login')
  public getAccessToken(@Query('code') codeParam: string ) {
    return this.authService.getAccessToken(codeParam);
  }
}

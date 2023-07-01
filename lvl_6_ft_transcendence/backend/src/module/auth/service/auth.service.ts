import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/module/users/service/users.service';
import { User } from 'src/typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly UsersService: UsersService,
    private jwtService: JwtService
  ) {}

  async login(user: User) {
    const payload = {
      login: user.name,
    };

    return {
      login: payload.login,
      access_token: this.jwtService.sign(payload),
    };
  }

  async verify(token: string): Promise<boolean> {
    try {
      const isAuth = await this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

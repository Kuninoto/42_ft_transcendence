import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/module/users/service/users.service';
import { User } from 'src/typeorm';
import { PayloadWithAccessToken } from '../strategy/jwt-auth.strategy';


@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService
  ) {}

  public login(user: User): PayloadWithAccessToken {
    return {
      id: user.id,
      access_token: this.jwtService.sign({id: user.id}),
    };
  }

  public async verify(token: string): Promise<boolean> {
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

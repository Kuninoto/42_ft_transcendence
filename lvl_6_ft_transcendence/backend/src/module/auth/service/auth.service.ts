import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/typeorm';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService
  ) {}

  // Return the signed JWT with the user id
  public login(user: User): { access_token: string } {
    return {
      access_token: this.jwtService.sign({id: user.id}),
    };
  }

  // Verifies if the JWT is valid
  public async verify(token: string): Promise<boolean> {
    // verify() throws if the token is invalid
    try {
      await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });

      console.log("giga trolled");
      return true;
    } catch (error) {
      return false;
    }
  }
}

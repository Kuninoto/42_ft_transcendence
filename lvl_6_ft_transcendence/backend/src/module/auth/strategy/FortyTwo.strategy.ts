import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from 'passport-42';
import { User } from "src/typeorm";
import { UsersService } from "src/module/users/service/users.service";

interface User42Info {
  username: string;
  avatar_url: string
}

@Injectable()
export class FortyTwoStrategy extends PassportStrategy(Strategy) {
    constructor(private usersService: UsersService) {
        super({
            clientID: process.env.INTRA_CLIENT_UID,
            clientSecret: process.env.INTRA_CLIENT_SECRET,
            callbackURL: process.env.INTRA_REDIRECT_URI,
            profileFields: {
                'username': 'login',
                'avatar_url': 'image.versions.medium'
            }
        });
    }

    async validate(accessToken: string,
                   refreshToken: string,
                   profile: User42Info
    ): Promise<User> {
      const user = await this.usersService.getUserByName(profile.username);

      if (user) {
        return user;
      }
  
      return await this.usersService.createUser({
        name: profile.username,
        avatar_url: profile.avatar_url
      });
    }
}


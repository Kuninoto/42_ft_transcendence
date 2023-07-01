import { Strategy } from 'passport-42';
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { User } from "src/typeorm";
import { UsersService } from "src/module/users/service/users.service";

interface User42Info {
  username: string;
  avatar_url: string
}

@Injectable()
export class FortyTwoAuthStrategy extends PassportStrategy(Strategy) {
    constructor(private usersService: UsersService) {
        super({
            clientID: process.env.INTRA_CLIENT_UID,
            clientSecret: process.env.INTRA_CLIENT_SECRET,
            callbackURL: process.env.INTRA_REDIRECT_URI,
            profileFields: {
                'username': 'login',
                'avatar_url': 'image.versions.medium'
            },
            scope: 'public'
        });
    }

    async validate(
      accessToken: string,
      refreshToken: string,
      profile: User42Info
    ): Promise<User> {
      console.log("validate() called")
      const user : User | undefined  = await this.usersService.getUserByName(profile.username);

      if (user) {
        console.log('User \"' + user.name + '\" already exists!');
        return user;
      }

      console.log('Creating user \"' + profile.username + '\"...');
      return await this.usersService.createUser({
        name: profile.username,
        avatar_url: profile.avatar_url
      });
    }
}


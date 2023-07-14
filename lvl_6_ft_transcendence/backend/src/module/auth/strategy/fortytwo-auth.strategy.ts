import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from 'passport-42';
import { User } from "src/typeorm";
import { UsersService } from "src/module/users/service/users.service";

// Because we'll specify which info
// we want from the whole 'me' endpoint
// of 42's API we need this interface,
// instead of the Profile object from passport-42, to
// represent the info what we'll in fact receive
interface User42Info {
  username: string;
  avatar_url: string
}

@Injectable()
export class FortyTwoAuthStrategy extends PassportStrategy(Strategy) {
    constructor(private usersService: UsersService) {

      console.log("INTRA_CLIENT_UID= " + process.env.INTRA_CLIENT_UID);
      console.log("INTRA_CLIENT_SECRET= " + process.env.INTRA_CLIENT_SECRET);
      console.log("INTRA_REDIRECT_URI= " + process.env.INTRA_REDIRECT_URI);

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
      const user: User | undefined  = await this.usersService.findUserByName(profile.username);

      if (user) {
        console.log('User \"' + user.name + '\" already exists!');
        return user;
      }

      console.log('Creating user \"' + profile.username + '\"');
      return await this.usersService.createUser({
        name: profile.username,
        avatar_url: profile.avatar_url
      });
    }
}


import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-42';
import { UsersService } from 'src/module/users/users.service';
import { User } from 'src/typeorm/index';

// Because we'll specify which info
// we want from the whole 'me' endpoint
// of 42's API we need this interface,
// instead of the Profile object from passport-42, to
// represent the info what we'll in fact receive
interface User42Info {
  username: string;
  avatar: string;
}

@Injectable()
export class FortyTwoAuthStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    console.log('INTRA_CLIENT_UID= ' + process.env.INTRA_CLIENT_UID);
    console.log('INTRA_CLIENT_SECRET= ' + process.env.INTRA_CLIENT_SECRET);
    console.log('INTRA_REDIRECT_URI= ' + process.env.INTRA_REDIRECT_URI);

    super({
      clientID: process.env.INTRA_CLIENT_UID,
      clientSecret: process.env.INTRA_CLIENT_SECRET,
      callbackURL: process.env.INTRA_REDIRECT_URI,
      profileFields: {
        username: 'login',
        avatar: 'image.versions.medium',
      },
      scope: 'public',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: User42Info,
  ): Promise<User> {
    const user: User | null = await this.usersService.findUserByIntraName(
      profile.username,
    );

    if (user) {
      return user;
    }

    Logger.log('"' + profile.username + '" logging in for the 1st time!');

    return await this.usersService.createUser({
      name: profile.username,
      intra_name: profile.username,
      avatar_url: profile.avatar,
      intra_profile_url:
        'https://profile.intra.42.fr/users/' + profile.username,
    });
  }
}

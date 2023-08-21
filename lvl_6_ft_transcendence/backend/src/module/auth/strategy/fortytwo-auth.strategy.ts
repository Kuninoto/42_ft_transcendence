import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-42';
import { User } from 'src/entity';
import { UsersService } from 'src/module/users/users.service';

// Because we'll specify which info
// we want from the whole 'me' endpoint
// of 42's API we need this interface,
// instead of the Profile object from passport-42, to
// represent the info that we'll in fact receive
// (as asked in lines 29 && 30)
interface User42Info {
  avatar: string;
  username: string;
}

@Injectable()
export class FortyTwoAuthStrategy extends PassportStrategy(Strategy, '42') {
  private readonly logger: Logger = new Logger(FortyTwoAuthStrategy.name);

  constructor(private usersService: UsersService) {
    console.log('INTRA_CLIENT_UID= ' + process.env.INTRA_CLIENT_UID);
    console.log('INTRA_CLIENT_SECRET= ' + process.env.INTRA_CLIENT_SECRET);
    console.log('INTRA_REDIRECT_URI= ' + process.env.INTRA_REDIRECT_URI);

    super({
      callbackURL: process.env.INTRA_REDIRECT_URI,
      clientID: process.env.INTRA_CLIENT_UID,
      clientSecret: process.env.INTRA_CLIENT_SECRET,
      profileFields: {
        avatar: 'image.versions.medium',
        username: 'login',
      },
      scope: 'public',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: User42Info,
  ): Promise<User> {
    const user: null | User = await this.usersService.findUserByIntraName(
      profile.username,
    );

    if (user) {
      return user;
    }

    this.logger.log(`"${profile.username}" logging in for the 1st time!`);

    return await this.usersService.createUser({
      avatar_url: profile.avatar,
      intra_name: profile.username,
      intra_profile_url:
        'https://profile.intra.42.fr/users/' + profile.username,
      name: profile.username,
    });
  }
}

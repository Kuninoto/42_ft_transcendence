import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { UsersService } from '../users/service/users.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private usersService: UsersService) {
    super();
  }

  serializeUser(user: any, done: (err: Error, user: any) => void): any {
    console.log(user);
    done(null, user.login);
  }

  async deserializeUser(
    payload: any,
    done: (err: Error, user: any) => void,
  ): Promise<any> {
    console.log('\nDeserialize');
    console.log(payload);

    const user = await this.usersService.getUserByName(payload.login);

    if (!user) {
      done(null, null);
    }
    done(null, user);
  }
}

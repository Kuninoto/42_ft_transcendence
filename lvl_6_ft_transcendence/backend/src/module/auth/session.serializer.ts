import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { UsersService } from '../users/users.service';
import { User } from 'src/typeorm';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private usersService: UsersService) {
    super();
  }

  public serializeUser(
    user: any,
    done: (err: Error, user: User) => void,
  ): void {
    done(null, user.id);
  }

  public async deserializeUser(
    payload: any,
    done: (err: Error, user: User) => void,
  ): Promise<any> {
    const user = await this.usersService.findUserByUID(payload.id);

    return user ? done(null, user) : done(null, null);
  }
}

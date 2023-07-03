import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { UsersService } from '../users/service/users.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private usersService: UsersService) {
    super();
  }

  public serializeUser(
    user: any,
    done: (err: Error, user: any) => void
  ): void {
    done(null, user.id);
  }

  public async deserializeUser(
    payload: any,
    done: (err: Error, user: any) => void
  ): Promise<any> {
    const user = await this.usersService.findUserById(payload.id);

    if (!user) {
      done(null, null);
    }

    done(null, user);
  }
}

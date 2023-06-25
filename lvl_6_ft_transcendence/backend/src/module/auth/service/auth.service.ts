import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/module/users/service/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly UsersService: UsersService) {}
}

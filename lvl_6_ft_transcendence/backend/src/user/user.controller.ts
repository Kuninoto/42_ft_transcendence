import { Controller, Get, Post, Delete, Patch, Body } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

//@Get(':id')
  @Get()
  public getUser() {
    return this.userService.getUser();
  }
  
  @Get()
  public getUserById() {
    return this.userService.getUserById();
  }

  @Post()
  public postUser(@Body user: ) {
    return this.userService.postUser();
  }

  @Delete()
  public deleteUserById() {
    return this.userService.deleteUserById();
  }

  @Patch()
  public patchUserById() {
    return this.userService.patchUserById();
  }
}

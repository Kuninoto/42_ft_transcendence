import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UsePipes,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from '../service/user.service';
import { CreateUserDTO } from '../dto/CreateUser.dto';
import { UpdateUserDTO } from '../dto/UpdateUser.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  // GET /user/id
  @Get('/:id')
  public getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserById(id);
  }

  // POST /user/create
  // @Body lets us access the request body
  // ValidationPipe ensures that request body
  // is in the CreateUserDTO format (our desired format)
  @Post('create')
  @UsePipes(ValidationPipe)
  public createUser(@Body() createUserDTO: CreateUserDTO) {
    return this.userService.createUser(createUserDTO);
  }

  // /user/delete/id
  // @Param lets us access the request parameters
  @Delete('delete/:id')
  public deleteUserById(@Param('id', ParseIntPipe) id: number) {
    try {
      this.userService.deleteUserById(id);
      return 'Successfully deleted user with ID: ' + id;
    }
    catch (err) {
      return 'Failed to delete user with ID: ' + id;
    }
  }

  // !TODO
  @Patch('edit/:id')
  public async patchUserById(@Param('id', ParseIntPipe) id: number,
                       @Body() updateUserDTO: UpdateUserDTO) {
    try {
      await this.userService.patchUserById(id, updateUserDTO);
      return 'Successfully patched user with ID: ' + id;
    }
    catch (err) {
      return 'Failed to patch user with ID: ' + id;
    }
  }
}

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
import { UserService } from '../services/user.service';
import { CreateUserDTO } from '../dtos/CreateUser.dto';
import { UpdateUserDTO } from '../dtos/UpdateUser.dto';

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
  // is in the CreateUserDTO format
  @Post('create')
  @UsePipes(ValidationPipe)
  public createUser(@Body() createUserDTO: CreateUserDTO) {
    return this.userService.createUser(createUserDTO);
  }

  // /user/delete/id
  // @Param lets us access the request parameters
  @Delete('delete/:id')
  public deleteUserById(@Param('id', ParseIntPipe) id: number) {
    this.userService.deleteUserById(id);
    return 'Deleted user with ID: ' + id;
  }

  // !TODO
  //@Patch('edit/:id')
  //public patchUserById(@Param('id', ParseIntPipe) id: number,
  //                     @Body() updateUserDTO: UpdateUserDTO) {
  //  return this.userService.patchUserById(id, updateUserDTO);
  //}
}

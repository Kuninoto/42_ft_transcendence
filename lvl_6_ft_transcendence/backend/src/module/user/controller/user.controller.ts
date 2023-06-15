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
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { UserService } from '../service/user.service';
import { CreateUserDTO } from '../dto/CreateUser.dto';
import { UpdateUserDTO } from '../dto/UpdateUser.dto';
import { User } from '../../../entity/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../middleware/multer/multer.config';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  // !TODO
  // Should it be a route or with params?
  
  // GET /user/id
  @Get('/:id')
  public async getUserById(@Param('id', ParseIntPipe) id: number) : Promise<User> {
    return await this.userService.getUserById(id);
  }

  // POST /user/create
  // @Body lets us access the request body
  // ValidationPipe ensures that request body
  // is in the CreateUserDTO format (our desired format)
  @Post('create')
  @UsePipes(ValidationPipe)
  public async createUser(@Body() createUserDTO: CreateUserDTO) : Promise<User> {
    return await this.userService.createUser(createUserDTO);
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
  @Post('edit/:id/avatar')
  @UseInterceptors(FileInterceptor('avatar', multerConfig))
  public async updateAvatarById(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() avatar,
  ) {
    const avatarURL = '../upload/avatars/' + avatar.filename;

    return await this.userService.updateUserById(id, {
      name: undefined,
      avatar_url: avatarURL,
      last_updated_at: undefined
    });
  }

  // !TODO
  @Patch('edit/:id/name')
  public async updateNameById(
    @Param('id', ParseIntPipe) id: number,
    @Body('name') newName: string,
  ) {
    return await this.userService.updateUserById(id, {
      name: newName,
      last_updated_at: undefined,
      avatar_url: undefined,
    });
  }
}

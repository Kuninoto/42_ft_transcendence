import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Res,
  Query,
  UsePipes,
  ParseIntPipe,
  ValidationPipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from '../service/users.service';
import { CreateUserDTO } from '../dto/CreateUser.dto';
// import { UpdateUserDTO } from '../dto/UpdateUser.dto';
import { User } from '../../../entity/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../middleware/multer/multer.config';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // !TODO
  // Should it be a route or with params?

  // GET /users/id
  @Get('/:ID')
  public async getUserById(
    @Param('ID', ParseIntPipe) id: number,
  ): Promise<User> {
    return await this.usersService.getUserById(id);
  }

  // /users/:ID/delete
  // @Param lets us access the request parameters
  @Delete('/:ID/delete')
  public deleteUserById(@Param('ID', ParseIntPipe) id: number) {
    try {
      this.usersService.deleteUserById(id);
      return 'Successfully deleted user with ID: ' + id;
    } catch (err) {
      return 'Failed to delete user with ID: ' + id;
    }
  }

  // !TODO
  // users/:ID/edit/avatar
  @Post('/:ID/edit/avatar')
  @UseInterceptors(FileInterceptor('avatar', multerConfig))
  public async updateUserAvatarByName(
    @Param('ID') id: number,
    @UploadedFile() avatar,
  ) {
    const avatarURL = '../upload/avatars/' + avatar.filename;

    return await this.usersService.updateUserById(id, {
      name: undefined,
      avatar_url: avatarURL,
      last_updated_at: undefined,
    });
  }

  @Get('/avatars/:FILEID')
  public async serveAvatar(
    @Param('ID') id: number,
    @Param('FILEID') fileId,
    @Res() res,
  ): Promise<any> {
    return res.sendFile(fileId, { root: 'upload/avatars' });
  }

  // !TODO
  // users/:ID/edit/name
  @Patch('/:ID/edit/name')
  public async updateUserByName(
    @Param('ID') id: number,
    @Body('name') newName: string,
  ) {
    return await this.usersService.updateUserById(id, {
      name: newName,
      last_updated_at: undefined,
      avatar_url: undefined,
    });
  }
}

import {
  Controller,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../service/users.service';
import { User } from '../../../entity/user.entity';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UpdateUserDTO } from '../dto/update-user.dto';
import { UpdateResult } from 'typeorm';
import { JwtAuthGuard } from 'src/module/auth/guard/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOkResponse({ type: User, description: "The user with the id equal to the id parameter" })
  @ApiNotFoundResponse()
  @UseGuards(JwtAuthGuard)
  // GET /users/:id
  @Get('/:id')
  public async getUserById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<User | undefined> {
    const user = await this.usersService.findUserById(id);

    if (!user) {
      throw new NotFoundException(); 
    }

    return user;
  }

  // DELETE /users/:id
  // @Param lets us access the request parameters
  @ApiOkResponse({ description: "Deletes the user with the id equal to the id parameter" })
  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  public async deleteUserById(
    @Param('id', ParseIntPipe) id: number
  ): Promise<string> {
    try {
      await this.usersService.deleteUserById(id);
      return 'Successfully deleted user with id: ' + id;
    } catch (err) {
      return 'Failed to delete user with ID: ' + id;
    }
  }

  // !TODO
  // users/:ID/edit/avatar
  //@Post('/:ID/edit/avatar')
  //@UseInterceptors(FileInterceptor('avatar', multerConfig))
  //public async updateUserAvatarById(
  //  @Param('ID') id: number,
  //  @UploadedFile() avatar,
  //) {
  //  const avatarURL = '../upload/avatars/' + avatar.filename;

  //  return await this.usersService.updateUserById(id, {
  //    avatar_url: avatarURL,
  //  });
  //}

  //@Get('/avatars/:FILEID')
  //public async serveAvatar(
  //  @Param('ID') id: number,
  //  @Param('FILEID') fileId,
  //  @Res() res,
  //) {
  //  return await res.sendFile(fileId, { root: 'upload/avatars' });
  //}

  // !TODO
  // PATCH users/:ID
  @ApiOkResponse({ description: "Updates user info (name or avatar)" })
  @UseGuards(JwtAuthGuard)
  @Patch('/:id')
  public async updateUserById(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDTO: UpdateUserDTO,
  ) : Promise<UpdateResult> {
    return await this.usersService.updateUserById(id, updateUserDTO);
  }
}

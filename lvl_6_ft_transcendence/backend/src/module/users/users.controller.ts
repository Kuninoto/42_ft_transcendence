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
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiPayloadTooLargeResponse,
  ApiTags,
  ApiUnsupportedMediaTypeResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User } from '../../entity/user.entity';
import { UpdateUserDTO } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/module/auth/guard/jwt-auth.guard';
import { Express } from 'express'
import { multerConfig } from './middleware/multer/multer.config';
import { ErrorResponseDTO } from 'src/common/dto/error-response.dto';
import { SuccessResponseDTO } from 'src/common/dto/success-response.dto';
import { SuccessResponse } from 'src/common/types/success-response.interface';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /* DEBUGGING ROUTES */

  /**
   * GET /api/users/:id
   * 
   * This is the route to visit to retrieve user's
   * (identified by id) info
   */
  /*
  @Get('/:id')
  public async getUserByUID(
    @Param('id', ParseIntPipe) userID: number,
  ): Promise<User> {
    const user = await this.usersService.findUserByUID(userID);

    if (!user) {
      throw new NotFoundException(); 
    }

    return user;
  } */

  /**
  * PATCH /api/users/:id
  * 
  * This is the route to visit to update any user's
  * (indentified by id) info
  */
  /*
  public async updateUserByUID(
    userID: number,
    updateUserDTO: UpdateUserDTO,
  ): Promise<SuccessResponseDTO> {
    return await this.usersService.updateUserByUID(userID, updateUserDTO);
  } */

  /**
  * DELETE /api/users/:id
  * 
  * This is the route to visit to delete any user's
  * (indentified by id) info from the database
  */
  /*
  @Delete('/:id')
  public async deleteUserByUID(
    @Param('id', ParseIntPipe) id: number
  ): Promise<SuccessResponse> {
    return await this.usersService.deleteUserByUID(id);
  } */

  /**
   * GET /api/users/me
   * 
   * Finds and returns the 'me' user info
   */
  @ApiOkResponse({ description: "Finds and returns 'me' user info" })
  @UseGuards(JwtAuthGuard)
  @Get('/me')
  public async getMyInfo(
    @Req() req: { user: User },
  ): Promise<User> {
    return await this.usersService.findUserByUID(req.user.id);
  }

  /**
   * PATCH /api/me/username
   * 
   * This is the route to visit to update 'me'
   * user username.
   */
  @ApiOkResponse({ description: "Updates 'me' user username" })
  @UseGuards(JwtAuthGuard)
  @Patch('/me/username')
  public async updateMyUsername(
    @Req() req: { user: User },
    @Body() body: { newUsername: string }
  ): Promise<SuccessResponse> {
    return await this.usersService.updateUsernameByUID(req.user.id, body.newUsername);
  }

  /**
   * PATCH /api/me/avatar
   * 
   * This is the route to visit to update the user's
   * avatar.
   * Stores the uploaded file (the new avatar) at
   * /src/public/ and updates the avatar_url on the
   * user's table
   */
  @UseInterceptors(FileInterceptor('avatar', multerConfig))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ["avatar"], properties: { image: { type: 'string', format: 'binary' } } } })
  @ApiBadRequestResponse({
    type: ErrorResponseDTO,
    description: 'If the uploaded image is not a png, jpg or jpeg or if its size exceeds the max size'
  })
  @ApiOkResponse({ description: "Stores the uploaded new avatar and updates the avatar_url on the user's table" })
  @UseGuards(JwtAuthGuard)
  @Patch('/me/avatar')
  public async updateMyAvatar(
    @Req() req: { user: User },
    @UploadedFile() file: Express.Multer.File,
  ): Promise<SuccessResponse> {
    if (!file)
      throw new BadRequestException("Invalid file");

    await this.usersService.updateUserAvatarByUID(req.user.id, file.path);
    return { message: "Successfully updated user avatar" };
  }

  /**
  * DELETE /api/users/me
  * 
  * This is the route to visit to delete 'me' user's
  * account from the database
  */
  @ApiOkResponse({ description: "Deletes 'me' user account" })
  @UseGuards(JwtAuthGuard)
  @Delete('/me')
  public async deleteMyAccount(@Req() req: { user: User })
  : Promise<SuccessResponse> {
   await this.usersService.deleteUserByUID(req.user.id);
   return { message: "Successfully deleted user" };
  }
}

import {
  Controller,
  Get,
  Delete,
  Patch,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
  Post,
  Param,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiTags
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User } from '../../entity/user.entity';
import { JwtAuthGuard } from 'src/module/auth/guard/jwt-auth.guard';
import { Express } from 'express'
import { multerConfig } from './middleware/multer/multer.config';
import { ErrorResponseDTO } from 'src/common/dto/error-response.dto';
import { SuccessResponse } from 'src/common/types/success-response.interface';
import { ErrorResponse } from 'src/common/types/error-response.interface';
import { meUserInfo } from './types/meUserInfo.interface';
import { FriendshipStatus } from 'src/entity/friendship.entity';
import { NonNegativeIntPipe } from 'src/common/pipe/non-negative-int.pipe';
import { FriendRequestResponseValidationPipe } from './pipe/friend-request-response-validation.pipe';
import { Friendship } from 'src/typeorm';

@ApiTags('users')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) { }

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
    @Param('id', NonNegativeIntPipe) userID: number,
  ): Promise<User | ErrorResponse> {
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
  * (identified by id) info
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
    @Param('id', NonNegativeIntPipe) id=number
  ): Promise<SuccessResponse> {
    return await this.usersService.deleteUserByUID(id);
  } */

  /**
   * GET /api/users/me
   * 
   * Finds and returns the 'me' user's info
   */
  @ApiOkResponse({ description: "Finds and returns 'me' user's info" })
  @Get('/me')
  public async getMyInfo(
    @Req() req: { user: User },
  ): Promise<meUserInfo> {
    Logger.log("User \"" + req.user.name + "\" requested his info using /me");

    // Destructure user's info so that we can filter "private" info
    const { name, avatar_url, intra_profile_url, has_2fa, created_at } = req.user;
  
    const friend_requests: Friendship[] = await this.usersService.getMyFriendRequests(req.user);
    const friendships: Friendship[] = await this.usersService.getMyFriends(req.user);

    const meInfo: meUserInfo = { name, avatar_url, intra_profile_url, has_2fa, created_at, friend_requests, friendships };
    return meInfo;
  }

  /**
   * PATCH /api/me/username
   * 
   * This is the route to visit to update 'me'
   * user's username.
   * 
   * Expects the new username as a field of a JSON on the body
   * 
   * {
   *  "newUsername":"<new_username>"
   * }
   */
  @ApiOkResponse({ description: "Updates 'me' user's username\nExpects the new username as the \"newUsername\" field of a JSON on the body" })
  @Patch('/me/username')
  public async updateMyUsername(
    @Req() req: { user: User },
    @Body() body: { newUsername: string }
  ): Promise<SuccessResponse | ErrorResponse> {
    Logger.log("Updating \"" + req.user.name + "\"'s username");

    return await this.usersService.updateUsernameByUID(req.user.id, body.newUsername);
  }

  /**
   * PATCH /api/me/avatar
   * 
   * This is the route to visit to update the user's
   * avatar.
   * Stores the uploaded file (the new avatar) at
   * /src/public/ and updates the avatar_url on the
   * user's table to the url that later allows requesting
   * e.g http://localhost:3000/api/users/avatars/<hashed_filename>.png
   *     (BACKEND_URL) + /api/users/avatars/ + <hashed_filename>.png
   */
  @UseInterceptors(FileInterceptor('avatar', multerConfig))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ["avatar"], properties: { image: { type: 'string', format: 'binary' } } } })
  @ApiBadRequestResponse({
    type: ErrorResponseDTO,
    description: "If the uploaded image is not a png, jpg or jpeg or if its size exceeds the max size"
  })
  @ApiOkResponse({ description: "Stores the uploaded new avatar and updates the avatar_url on the user's table" })
  @Patch('/me/avatar')
  public async updateMyAvatar(
    @Req() req: { user: User },
    @UploadedFile() file: Express.Multer.File,
  ): Promise<SuccessResponse | ErrorResponse> {
    if (!file) {
      Logger.error("\"" + req.user.name + "\" failed to upload his avatar");
      throw new BadRequestException("Invalid file");
    }

    Logger.log("Updating \"" + req.user.name + "\"'s avatar");

    return await this.usersService.updateUserAvatarByUID(
      req.user.id,
      process.env.BACKEND_URL + "/api/users/avatars/" + file.filename
    );
  }

  /**
  * DELETE /api/users/me
  * 
  * This is the route to visit to delete 'me' user's
  * account from the database
  */
  @ApiOkResponse({ description: "Deletes 'me' user's account" })
  @Delete('/me')
  public async deleteMyAccount(@Req() req: { user: User })
    : Promise<SuccessResponse> {
    Logger.log("Deleting \"" + req.user.name + "\"'s account");

    return await this.usersService.deleteUserByUID(req.user.id);
  }

  @ApiOkResponse({ description: "Returns the status of the friend request" })
  @Get('friend-request/status/:receiverId')
  public async getFriendshipStatus(
    @Req() req: { user: User },
    @Param('receiverId', NonNegativeIntPipe) receiverUID: number
  ): Promise<FriendshipStatus> {    
    return await this.usersService.getFriendshipStatus(req.user, receiverUID);
  }

  @ApiOkResponse({ description: "Sends a friend request to the user which id=receiverId" })
  @HttpCode(200)
  @Post('friend-request/send/:receiverId')
  public async sendFriendRequest(
    @Req() req: { user: User },
    @Param('receiverId', NonNegativeIntPipe) receiverUID: number
  ): Promise<SuccessResponse | ErrorResponse> {
    return await this.usersService.sendFriendRequest(req.user, receiverUID);
  }

  @ApiOkResponse({ description: "Updates the friend request status according to the response sent on the body ('accepted' or 'declined')" })
  @Patch('friend-request/respond/:friendRequestId')
  public async respondToFriendRequest(
    @Param('friendRequestId', NonNegativeIntPipe) friendRequestID: number,
    @Body(new FriendRequestResponseValidationPipe) body: { response: FriendshipStatus }
  ): Promise<SuccessResponse> {
    return await this.usersService.respondToFriendRequest(friendRequestID, body.response); 
  }
}
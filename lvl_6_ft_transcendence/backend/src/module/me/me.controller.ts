import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiOkResponse,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { ExtractUser } from 'src/common/decorator/extract-user.decorator';
import { User } from 'src/entity/index';
import {
  AvatarUpdationRequest,
  BlockedUserInterface,
  ChatRoomInterface,
  ErrorResponse,
  Friend,
  FriendRequest,
  GameThemeUpdationRequest,
  MeUserInfo,
  SuccessResponse,
  UsernameUpdationRequest,
} from 'types';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { multerConfig } from './middleware/multer/multer.config';

@ApiTags('me')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeController {
  constructor(private readonly usersService: UsersService) {}

  private readonly logger: Logger = new Logger(MeController.name);

  /**
   * GET /api/me
   *
   * Finds and returns the 'me' user's info
   */
  @ApiOperation({ description: "Get the 'me' user's info" })
  @ApiOkResponse({
    description: "Successfully finds and returns 'me' user's info",
  })
  @Get()
  public async getMyInfo(@ExtractUser() user: User): Promise<MeUserInfo> {
    this.logger.log(`"${user.name}" requested his info`);
    return await this.usersService.findMyInfo(user);
  }

  /**
   * GET /api/me/friendlist
   *
   * Finds and returns the 'me' user's friendlist
   */
  @ApiOperation({ description: "Get the 'me' user's friendlist" })
  @ApiOkResponse({
    description: "Successfully finds and returns 'me' user's friendlist",
  })
  @Get('friendlist')
  public async findMyFriendlist(@ExtractUser() user: User): Promise<Friend[]> {
    this.logger.log(`"${user.name}" requested his friendlist`);
    return await this.usersService.findMyFriendlist(user.id);
  }

  /**
   * GET /api/me/friend-requests
   *
   * Finds and returns the 'me' user's friend-requests
   */
  @ApiOperation({ description: "Get the 'me' user's friend-requests" })
  @ApiOkResponse({
    description:
      "Successfully finds and returns the 'me' user's friend-requests",
  })
  @Get('friend-requests')
  public async findMyFriendRequests(
    @ExtractUser() user: User,
  ): Promise<FriendRequest[]> {
    this.logger.log(`"${user.name}" requested his received friend-requests`);
    return await this.usersService.findMyFriendRequests(user.id);
  }

  /**
   * GET /api/me/blocklist
   *
   * Finds and returns the 'me' user's blocklist
   */
  @ApiOperation({ description: "Get the 'me' user's blocklist" })
  @ApiOkResponse({
    description: "Successfully finds and returns the 'me' user's blocklist",
  })
  @Get('blocklist')
  public async findMyBlocklist(
    @ExtractUser() user: User,
  ): Promise<BlockedUserInterface[]> {
    this.logger.log(`"${user.name}" requested his blocklist`);
    return await this.usersService.findMyBlocklist(user.id);
  }

  /**
   * GET /api/me/rooms
   *
   * Finds and returns the rooms where 'me' user is
   */
  @ApiOperation({ description: "Get the rooms where 'me' user is" })
  @ApiOkResponse({
    description: "Successfully finds and returns the rooms where 'me' user is",
  })
  @Get('rooms')
  public async findMyChatRooms(
    @ExtractUser() user: User,
  ): Promise<ChatRoomInterface[]> {
    this.logger.log(`"${user.name}" requested his rooms`);
    return await this.usersService.findChatRoomsWhereUserIs(user.id);
  }

  /**
   * PATCH /api/me/username
   *
   * This is the route to visit to update 'me'
   * user's username.
   *
   */
  @ApiOperation({ description: "Update 'me' user's username" })
  @ApiBody({ type: UsernameUpdationRequest })
  @ApiBadRequestResponse({
    description:
      'If no new username was provided or if the new username is less than 4 or more than 10 chars long',
  })
  @ApiConflictResponse({
    description: 'If the new username is already taken',
  })
  @ApiOkResponse({
    description: "Successfully updated 'me' user's username",
  })
  @Patch('username')
  public async updateMyUsername(
    @ExtractUser() user: User,
    @Body() body: UsernameUpdationRequest,
  ): Promise<SuccessResponse | ErrorResponse> {
    this.logger.log(`Updating ${user.name}'s username`);

    if (!body.newUsername) {
      this.logger.warn(`"${user.name}" failed to update his username`);
      throw new BadRequestException(
        "Expected 'newUsername' as a field of the body's JSON",
      );
    }

    return await this.usersService.updateUsernameByUID(
      user.id,
      body.newUsername,
    );
  }

  /**
   * PATCH /api/me/avatar
   *
   * This is the route to visit to update the user's
   * avatar.
   * Stores the uploaded file (the new avatar) at
   * /src/public/ and updates the avatar_url
   * on the user's table to the url that later allows requesting
   * e.g http://http://localhost:3000/api/users/avatars/<hashed_filename>.png
   *     (BACKEND_URL) + /api/users/avatars/ + <hashed_filename>.png
   */
  @ApiOperation({ description: "Update 'me' user's avatar" })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AvatarUpdationRequest })
  @ApiBadRequestResponse({
    description:
      'If the uploaded image is not a png, jpg or jpeg or if its size exceeds the max size',
  })
  @ApiOkResponse({
    description: "Successfully updates 'me' user's avatar",
  })
  @UseInterceptors(FileInterceptor('avatar', multerConfig))
  @Patch('avatar')
  public async updateMyAvatar(
    @ExtractUser() user: User,
    @UploadedFile() avatar: Express.Multer.File,
  ): Promise<SuccessResponse | ErrorResponse> {
    if (!avatar) {
      this.logger.warn(
        `"${user.name}" failed to update his avatar because the file was invalid`,
      );
      throw new BadRequestException('Invalid file');
    }
    this.logger.log(`"${user.name}" updated his avatar`);

    return await this.usersService.updateUserAvatarByUID(
      user.id,
      process.env.BACKEND_URL + '/api/users/avatars/' + avatar.filename,
    );
  }

  /**
   * PATCH /api/me/game-theme
   *
   * This is the route to visit to update 'me'
   * user's game theme.
   */
  @ApiOperation({ description: "Update 'me' user's game theme" })
  @ApiBody({ type: GameThemeUpdationRequest })
  @ApiBadRequestResponse({
    description: 'If the game theme is invalid',
  })
  @ApiOkResponse({
    description: "Successfully updated 'me' user's game theme",
  })
  @Patch('game-theme')
  public async updateMyGameTheme(
    @ExtractUser() user: User,
    @Body() body: GameThemeUpdationRequest,
  ): Promise<SuccessResponse | ErrorResponse> {
    this.logger.log(`"${user.name}" updated his game theme`);

    return await this.usersService.updateGameThemeByUID(
      user.id,
      body.newGameTheme,
    );
  }
}

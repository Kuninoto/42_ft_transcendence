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
@ApiBearerAuth('swagger-basic-auth')
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
  @ApiOkResponse({ description: "Finds and returns 'me' user's info" })
  @Get()
  public async getMyInfo(@ExtractUser() user: User): Promise<MeUserInfo> {
    this.logger.log(`"${user.name}" requested his info`);
    return await this.usersService.findMyInfo(user.id);
  }

  /**
   * GET /api/me/friends
   *
   * Finds and returns the 'me' user's friends
   */
  @ApiOkResponse({
    description: "Finds and returns the 'me' user's friends",
  })
  @Get('friends')
  public async findMyFriends(@ExtractUser() user: User): Promise<Friend[]> {
    this.logger.log(`"${user.name}" requested his friends info`);

    return await this.usersService.findMyFriends(user.id);
  }

  /**
   * GET /api/me/friend-request
   *
   * Finds and returns the 'me' user's friend-requests
   */
  @ApiOkResponse({
    description: "Finds and returns the 'me' user's friend-requests",
  })
  @Get('friend-request')
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
  @ApiOkResponse({
    description: "Finds and returns the 'me' user's blocklist",
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
  @ApiOkResponse({
    description:
      "Finds and returns the rooms where 'me' user is (ChatRoomInterface[])",
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
  @ApiBody({ type: UsernameUpdationRequest })
  @ApiOkResponse({
    description: "Updates 'me' user's username",
  })
  @ApiBadRequestResponse({
    description:
      'If no new username was provided or if the new username is less than 4 or more than 10 chars long',
  })
  @ApiConflictResponse({
    description: 'If the new username is already taken',
  })
  @Patch('username')
  public async updateMyUsername(
    @ExtractUser() user: User,
    @Body() body: UsernameUpdationRequest,
  ): Promise<ErrorResponse | SuccessResponse> {
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AvatarUpdationRequest })
  @ApiBadRequestResponse({
    description:
      'If the uploaded image is not a png, jpg or jpeg or if its size exceeds the max size',
  })
  @ApiOkResponse({
    description:
      "Stores the uploaded new avatar and updates the avatar_url on the user's table",
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
    this.logger.log(`${user.name} updated his avatar`);

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
  @ApiBody({ type: GameThemeUpdationRequest })
  @ApiBadRequestResponse({
    description: 'If the game theme is invalid',
  })
  @ApiOkResponse({
    description: "Updates 'me' user's game theme",
  })
  @Patch('game-theme')
  public async updateMyGameTheme(
    @ExtractUser() user: User,
    @Body() body: GameThemeUpdationRequest,
  ): Promise<ErrorResponse | SuccessResponse> {
    this.logger.log(`${user.name} is updating his game theme`);

    return await this.usersService.updateGameThemeByUID(
      user.id,
      body.newGameTheme,
    );
  }
}

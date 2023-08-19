import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Patch,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User } from 'src/typeorm/index';
import {
  BlockedUserInterface,
  ErrorResponse,
  Friend,
  FriendRequestInterface,
  GameThemes,
  MeUserInfo,
  SuccessResponse,
  UsernameUpdationRequest,
} from 'types';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { FriendshipsService } from '../friendships/friendships.service';
import { UsersService } from '../users/users.service';
import { multerConfig } from './middleware/multer/multer.config';
import { GameThemeUpdateValidationPipe } from './pipe/game-theme-update-validation.pipe';

@ApiTags('me')
@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeController {
  constructor(
    private readonly friendshipsService: FriendshipsService,
    private readonly usersService: UsersService,
  ) {}

  private readonly logger: Logger = new Logger(MeController.name);

  /**
   * GET /api/me
   *
   * Finds and returns the 'me' user's info
   */
  @ApiOkResponse({ description: "Finds and returns 'me' user's info" })
  @Get()
  public async getMyInfo(@Req() req: { user: User }): Promise<MeUserInfo> {
    this.logger.log(`"${req.user.name}" requested his info`);

    // Destructure user's info so that we can filter info that doesn't belong to MeUserInfo
    const {
      id,
      name,
      intra_name,
      avatar_url,
      intra_profile_url,
      has_2fa,
      game_theme,
      created_at,
    } = req.user;

    const meInfo: MeUserInfo = {
      id,
      name,
      intra_name,
      avatar_url,
      intra_profile_url,
      has_2fa,
      game_theme,
      created_at,
    };
    return meInfo;
  }

  /**
   * GET /api/me/friends
   *
   * Finds and returns the 'me' user's friends
   */
  @ApiOkResponse({ description: "Finds and returns the 'me' user's friends" })
  @Get('friends')
  public async getMyFriends(@Req() req: { user: User }): Promise<Friend[]> {
    this.logger.log(`"${req.user.name}" requested his friends info`);

    const friendList: Friend[] = await this.friendshipsService.findFriendsByUID(
      req.user.id,
    );

    return friendList;
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
  public async getMyFriendRequests(
    @Req() req: { user: User },
  ): Promise<FriendRequestInterface[]> {
    this.logger.log(
      `"${req.user.name}" requested his received friend-requests`,
    );

    return await this.friendshipsService.getMyFriendRequests(req.user);
  }

  /**
   * GET /api/me/blocklist
   *
   * Finds and returns the 'me' user's blocklist
   */
  @ApiOkResponse({ description: "Finds and returns the 'me' user's blocklist" })
  @Get('blocklist')
  public async getMyBlockedUsers(
    @Req() req: { user: User },
  ): Promise<BlockedUserInterface[]> {
    this.logger.log(`"${req.user.name}" requested his blocklist`);
    return await this.friendshipsService.getMyBlocklist(req.user.id);
  }

  /**
   * PATCH /api/me/username
   *
   * This is the route to visit to update 'me'
   * user's username.
   *
   */
  @ApiOkResponse({
    description: "Updates 'me' user's username",
  })
  @ApiBadRequestResponse({
    description:
      'If no new username was provided or if the new username is less than 4 or more than 10 chars long',
  })
  @ApiConflictResponse({ description: 'If the new username is already taken' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['newUsername'],
      properties: { newUsername: { type: 'string' } },
    },
  })
  @Patch('username')
  public async updateMyUsername(
    @Req() req: { user: User },
    @Body() body: UsernameUpdationRequest,
  ): Promise<SuccessResponse | ErrorResponse> {
    this.logger.log(`Updating ${req.user.name}'s username`);

    if (!body.newUsername) {
      this.logger.warn(`"${req.user.name}" failed to update his username`);
      throw new BadRequestException(
        "Expected 'newUsername' as a field of the body's JSON",
      );
    }

    return await this.usersService.updateUsernameByUID(
      req.user.id,
      body.newUsername,
    );
  }

  /**
   * PATCH /api/me/game-theme
   *
   * This is the route to visit to update 'me'
   * user's game theme.
   */
  @ApiOkResponse({
    description: "Updates 'me' user's game theme",
  })
  @ApiBadRequestResponse({
    description: "If the theme doesn't exist",
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['newGameTheme'],
      properties: { newGameTheme: { type: 'string' } },
    },
  })
  @Patch('game-theme')
  public async updateMyGameTheme(
    @Req() req: { user: User },
    @Body(new GameThemeUpdateValidationPipe()) newGameTheme: GameThemes,
  ): Promise<SuccessResponse | ErrorResponse> {
    this.logger.log(`${req.user.name} is updating his game theme`);

    return await this.usersService.updateGameThemeByUID(
      req.user.id,
      newGameTheme,
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
   * e.g http://localhost:3000/api/users/avatars/<hashed_filename>.png
   *     (BACKEND_URL) + /api/users/avatars/ + <hashed_filename>.png
   */
  @UseInterceptors(FileInterceptor('avatar', multerConfig))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['avatar'],
      properties: { avatar: { type: 'string', format: 'binary' } },
    },
  })
  @ApiBadRequestResponse({
    description:
      'If the uploaded image is not a png, jpg or jpeg or if its size exceeds the max size',
  })
  @ApiOkResponse({
    description:
      "Stores the uploaded new avatar and updates the avatar_url on the user's table",
  })
  @Patch('avatar')
  public async updateMyAvatar(
    @Req() req: { user: User },
    @UploadedFile() file: Express.Multer.File,
  ): Promise<SuccessResponse | ErrorResponse> {
    if (!file) {
      this.logger.warn(`"${req.user.name}" failed to upload his avatar`);
      throw new BadRequestException('Invalid file');
    }

    this.logger.log(`Updating ${req.user.name}\'s avatar`);

    return await this.usersService.updateUserAvatarByUID(
      req.user.id,
      process.env.BACKEND_URL + '/api/users/avatars/' + file.filename,
    );
  }

  /**
   * DELETE /api/me
   *
   * This is the route to visit to delete 'me' user's
   * account from the database
   */
  @ApiOkResponse({ description: "Deletes 'me' user's account" })
  @Delete()
  public async deleteMyAccount(
    @Req() req: { user: User },
  ): Promise<SuccessResponse> {
    this.logger.log(`Deleting ${req.user.name}'s account`);

    return await this.usersService.deleteUserByUID(req.user.id);
  }
}

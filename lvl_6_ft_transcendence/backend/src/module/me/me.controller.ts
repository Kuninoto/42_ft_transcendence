import {
  Controller,
  Get,
  Body,
  Patch,
  Delete,
  BadRequestException,
  Logger,
  Req,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { GameThemeUpdateValidationPipe } from './pipe/game-theme-update-validation.pipe';
import { User } from 'src/entity/index';
import { BlockedUserInterface } from '../../common/types/blocked-user-interface.interface';
import { ErrorResponse } from '../../common/types/error-response.interface';
import { SuccessResponse } from '../../common/types/success-response.interface';
import { FriendInterface } from '../../common/types/friend-interface.interface';
import { FriendRequestInterface } from '../../common/types/friend-request.interface';
import { multerConfig } from './middleware/multer/multer.config';
import { meUserInfo } from '../../common/types/me-user-info.interface';
import { FriendshipsService } from '../friendships/friendships.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { GameThemes } from '../../common/types/game-themes.enum';
import { GameResultInterface } from 'src/common/types/game-result-interface.interface';

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
  public async getMyInfo(@Req() req: { user: User }): Promise<meUserInfo> {
    this.logger.log('"' + req.user.name + '" requested his info');

    // Destructure user's info so that we can filter info that doesn't belong to meUserInfo
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

    const meInfo: meUserInfo = {
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
  public async getMyFriends(
    @Req() req: { user: User },
  ): Promise<FriendInterface[]> {
    this.logger.log('"' + req.user.name + '" requested his friends info');

    const friendList: FriendInterface[] =
      await this.friendshipsService.findFriendsByUID(req.user.id);

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
      '"' + req.user.name + '" requested his friend-requests info',
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
    this.logger.log('"' + req.user.name + '" requested his blocklist info');

    return await this.friendshipsService.getMyBlocklist(req.user.id);
  }

  /**
   * GET /api/me/match-history
   *
   * Finds and returns the 'me' user's match history
   */
  @ApiOkResponse({
    description:
      "Finds and returns the 'me' user's match history (GameResultInterface[])",
  })
  @Get('match-history')
  public async getMyMatchHistory(
    @Req() req: { user: User },
  ): Promise<GameResultInterface[]> {
    this.logger.log('"' + req.user.name + '" requested his match history info');

    return await this.usersService.findMatchHistoryByUID(req.user.id);
  }

  /**
   * PATCH /api/me/username
   *
   * This is the route to visit to update 'me'
   * user's username.
   *
   * Expects the new username as the "newUsername" field of a JSON on the body
   *
   * {
   *  "newUsername":"<new_username>"
   * }
   */
  @ApiOkResponse({
    description:
      "Updates 'me' user's username\nExpects the new username as the \"newUsername\" field of a JSON on the body",
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
    @Body() body: { newUsername: string },
  ): Promise<SuccessResponse | ErrorResponse> {
    this.logger.log('Updating "' + req.user.name + '"\'s username');

    if (!body.newUsername) {
      this.logger.error('A user failed to update his username');
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
   *
   * Expects the new username as the "newGameTheme" field of a JSON on the body
   *
   * {
   *  "newGameTheme":"<new_game_theme>"
   * }
   */
  @ApiOkResponse({
    description:
      "Updates 'me' user's game theme\nExpects the new game theme as the \"newGameTheme\" field of a JSON on the body",
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
    this.logger.log('Updating "' + req.user.name + '"\'s game theme');

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
      this.logger.error('"' + req.user.name + '" failed to upload his avatar');
      throw new BadRequestException('Invalid file');
    }

    this.logger.log('Updating "' + req.user.name + '"\'s avatar');

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
    this.logger.log('Deleting "' + req.user.name + '"\'s account');

    return await this.usersService.deleteUserByUID(req.user.id);
  }
}

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
import { User } from 'src/typeorm';
import { BlockedUserInterface } from '../../common/types/blocked-user-interface.interface';
import { ErrorResponse } from '../../common/types/error-response.interface';
import { SuccessResponse } from '../../common/types/success-response.interface';
import { FriendInterface } from '../../common/types/friend-interface.interface';
import { FriendRequestInterface } from '../../common/types/friend-request.interface';
import { multerConfig } from '../users/middleware/multer/multer.config';
import { meUserInfo } from '../../common/types/me-user-info.interface';
import { FriendshipsService } from '../friendships/friendships.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { GameThemes } from '../../common/types/game-themes.enum';

@ApiTags('me')
@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeController {
  constructor(
    private readonly friendshipsService: FriendshipsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * GET /api/me
   *
   * Finds and returns the 'me' user's info
   */
  @ApiOkResponse({ description: "Finds and returns 'me' user's info" })
  @Get()
  public async getMyInfo(@Req() req: { user: User }): Promise<meUserInfo> {
    Logger.log('"' + req.user.name + '" requested his info using /me');

    // Destructure user's info so that we can filter info that doesn't belong to meUserInfo
    const {
      id,
      name,
      avatar_url,
      intra_profile_url,
      has_2fa,
      game_theme,
      created_at,
    } = req.user;

    const meInfo: meUserInfo = {
      id,
      name,
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
    Logger.log(
      '"' + req.user.name + '" requested his friends info using /me/friends',
    );

    const friendList: FriendInterface[] =
      await this.friendshipsService.getMyFriends(req.user);

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
    Logger.log(
      '"' +
        req.user.name +
        '" requested his friend-requests info using /me/friend-requests',
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
    Logger.log(
      '"' +
        req.user.name +
        '" requested his blocklist info using /me/blocklist',
    );

    return await this.friendshipsService.getMyBlocklist(req.user.id);
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
    Logger.log('Deleting "' + req.user.name + '"\'s account');

    return await this.usersService.deleteUserByUID(req.user.id);
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
    description: 'If the new username is more than 10 chars long',
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
    Logger.log('Updating "' + req.user.name + '"\'s username');

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
    Logger.log('Updating "' + req.user.name + '"\'s username');

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
   * /src/public/ and updates the avatar_url on the
   * user's table to the url that later allows requesting
   * e.g http://localhost:3000/api/users/avatars/<hashed_filename>.png
   *     (BACKEND_URL) + /api/users/avatars/ + <hashed_filename>.png
   */
  @UseInterceptors(FileInterceptor('avatar', multerConfig))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['avatar'],
      properties: { image: { type: 'string', format: 'binary' } },
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
      Logger.error('"' + req.user.name + '" failed to upload his avatar');
      throw new BadRequestException('Invalid file');
    }

    Logger.log('Updating "' + req.user.name + '"\'s avatar');

    return await this.usersService.updateUserAvatarByUID(
      req.user.id,
      process.env.BACKEND_URL + '/api/users/avatars/' + file.filename,
    );
  }
}

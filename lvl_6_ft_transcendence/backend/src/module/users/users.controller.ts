import {
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { NonNegativeIntPipe } from 'src/common/pipe/non-negative-int.pipe';
import { JwtAuthGuard } from 'src/module/auth/guard/jwt-auth.guard';
import { User } from 'src/typeorm';
import { ErrorResponse, UserProfile, UserSearchInfo } from 'types';
import { UsersService } from './users.service';

@ApiTags('users')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private readonly logger: Logger = new Logger(UsersController.name);

  /**
   * GET /api/users/search?username=
   *
   * This is the route to visit to search for UserSearchInfo
   * by username proximity
   * Returns up to 5 users info that match that "piece" of username
   * If no <username> is provided returns an empty array
   */
  @ApiOkResponse({
    description:
      'Finds users by username proximity and returns a UserProfile[] with up to 5 elements, if no <username> is provided returns an empty array\nIgnores blocked users and friends',
  })
  @ApiQuery({
    type: 'string',
    name: 'username',
    description: 'A piece of the username(s) to match',
  })
  @Get('/search')
  public async findUsersByUsernameProximity(
    @Req() req: { user: User },
    @Query('username') query: string,
  ): Promise<UserSearchInfo[]> {
    if (!query) return [];

    return await this.usersService.findUsersSearchInfoByUsernameProximity(
      req.user,
      query,
    );
  }

  /**
   * GET /api/users/:userId
   *
   * @description This is the route to visit to retrieve user's
   * (identified by id) profile
   */
  @ApiOkResponse({
    description: "Finds User's which id=userId profile",
  })
  @ApiNotFoundResponse({
    description: "If user with id=userId doesn't exist ",
  })
  @ApiParam({
    name: 'userId',
    description: 'User id of the user to user we want the profile of',
  })
  @Get('/:userId')
  public async findUserProfileByUID(
    @Req() req: { user: User },
    @Param('userId', NonNegativeIntPipe) userId: number,
  ): Promise<UserProfile | ErrorResponse> {
    const userProfile: UserProfile | null =
      await this.usersService.findUserProfileByUID(req.user, userId);

    if (!userProfile) {
      this.logger.warn(
        `"${req.user.name}" request the profile of a non-existing user`,
      );
      throw new NotFoundException('User with id= ' + userId + "doesn't exist");
    }

    return userProfile;
  }
}

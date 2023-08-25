import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ExtractUser } from 'src/common/decorator/extract-user.decorator';
import { NonNegativeIntPipe } from 'src/common/pipe/non-negative-int.pipe';
import { User } from 'src/entity';
import { JwtAuthGuard } from 'src/module/auth/guard/jwt-auth.guard';
import { ErrorResponse, UserProfile, UserSearchInfo } from 'types';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('swagger-basic-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  //private readonly logger: Logger = new Logger(UsersController.name);

  /**
   * GET /api/users/profile/:userId
   *
   * @description This is the route to visit to retrieve user's
   * (identified by id) profile
   */
  @ApiOkResponse({
    description: "Finds User's which id=userId profile",
  })
  @ApiNotFoundResponse({
    description:
      "If user with id=userId doesn't exist or the requester is blocked by him ",
  })
  @ApiParam({
    description: 'User id of the user to user we want the profile of',
    name: 'userId',
  })
  @Get('/profile/:userId')
  public async findUserProfileByUID(
    @ExtractUser() user: User,
    @Param('userId', NonNegativeIntPipe) userId: number,
  ): Promise<UserProfile | ErrorResponse> {
    const userProfile: UserProfile | null =
      await this.usersService.findUserProfileByUID(user, userId);

    if (!userProfile) {
      throw new NotFoundException('User not found');
    }

    return userProfile;
  }

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
    description: 'A piece of the username(s) to match',
    name: 'username',
    type: 'string',
  })
  @Get('/search')
  public async findUsersByUsernameProximity(
    @ExtractUser() user: User,
    @Query('username') query: string,
  ): Promise<UserSearchInfo[]> {
    if (!query) return [];

    return await this.usersService.findUsersSearchInfoByUsernameProximity(
      user,
      query,
    );
  }
}

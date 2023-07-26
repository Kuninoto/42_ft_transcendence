import {
  Controller,
  Get,
  UseGuards,
  Query,
  NotFoundException,
  Param,
  Req,
} from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { NonNegativeIntPipe } from 'src/common/pipe/non-negative-int.pipe';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/module/auth/guard/jwt-auth.guard';
import { ErrorResponse } from '../../common/types/error-response.interface';
import { User } from 'src/typeorm';
import { UserProfile } from '../../common/types/user-profile.interface';
import { UserSearchInfo } from '../../common/types/user-search-info.interface';

@ApiTags('users')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /* DEBUGGING ROUTES */

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
   * GET /api/users?username=
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
  @Get('/search')
  public async getUsersByUsernameProximity(
    @Req() req: { user: User },
    @Query('username') query: string,
  ): Promise<UserSearchInfo[]> {
    if (!query) {
      return [];
    }

    return await this.usersService.findUsersSearchInfoByUsernameProximity(
      req.user,
      query,
    );
  }

  /**
   * GET /api/users/:userId
   *
   * This is the route to visit to retrieve user's
   * (identified by id) profile
   */
  @ApiOkResponse({
    description: "Finds User's which id=userId profile",
  })
  @ApiNotFoundResponse({ description: "If user with id=userId doesn't exist " })
  @Get('/:userId')
  public async getUserProfileByUID(
    @Req() req: { user: User },
    @Param('userId', NonNegativeIntPipe) userID: number,
  ): Promise<UserProfile | ErrorResponse> {
    const userProfile: UserProfile | null =
      await this.usersService.findUserProfileByUID(req.user, userID);

    if (!userProfile) {
      throw new NotFoundException('User with id= ' + userID + "doesn't exist");
    }

    return userProfile;
  }
}

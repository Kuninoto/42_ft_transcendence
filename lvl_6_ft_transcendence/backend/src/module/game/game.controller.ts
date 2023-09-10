import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ExtractUser } from 'src/common/decorator/extract-user.decorator';
import { User } from 'src/entity';
import {
  ErrorResponse,
  GameInviteSentResponse,
  RespondToGameInviteRequest,
  SendGameInviteRequest,
  SuccessResponse,
  UserStatsForLeaderboard,
} from 'types';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { UserStatsService } from '../user-stats/user-stats.service';
import { GameService } from './game.service';

@ApiTags('game')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('game')
export class GameController {
  constructor(
    private readonly userStatsService: UserStatsService,
    private readonly gameService: GameService,
  ) {}

  private readonly logger: Logger = new Logger(GameController.name);

  /**
   * GET /api/game/leaderboard
   *
   * Returns leaderboard (UserStatsForLeaderboard[]) user at index 0 is the top scorer (descending order)
   */
  @ApiOperation({ description: 'Get the leaderboard' })
  @ApiOkResponse({
    description:
      'Returns leaderboard (UserStatsForLeaderboard[]) user at index 0 is the top scorer (descending order)',
  })
  @Get('leaderboard')
  public async getLeaderboard(
    @ExtractUser() user: User,
  ): Promise<UserStatsForLeaderboard[]> {
    this.logger.log(`${user.name} requested the leaderboard`);
    return await this.userStatsService.getLeaderboard();
  }

  @ApiOperation({ description: 'Send a game invite' })
  @ApiNotFoundResponse({ description: "If receiver doesn't exist" })
  @ApiConflictResponse({
    description:
      'If requesting user or receiver are not online (cannot be in queue, game or offline)\n',
  })
  @ApiOkResponse({
    description: 'Successfully sent game invite',
  })
  @Post('/invite')
  async sendGameInvite(
    @ExtractUser() user: User,
    @Body() body: SendGameInviteRequest,
  ): Promise<GameInviteSentResponse | ErrorResponse> {
    const inviteId: string = await this.gameService.sendGameInvite(
      user.id,
      body.receiverUID,
    );
    return { inviteId: inviteId };
  }

  @ApiOperation({ description: 'Respond to game invite' })
  @ApiBadRequestResponse({
    description:
      "If request is malformed or if invite isn't meant for the requesting user",
  })
  @ApiConflictResponse({
    description: 'If user accepts the invite but is offline',
  })
  @ApiNotFoundResponse({ description: 'If invite is not found' })
  @ApiOkResponse({
    description: 'Successfully responded to game invite',
  })
  @Patch('/:inviteId/status')
  async respondToGameInvite(
    @ExtractUser() user: User,
    @Param('inviteId') inviteId: string,
    @Body() body: RespondToGameInviteRequest,
  ): Promise<SuccessResponse | ErrorResponse> {
    if (!inviteId) throw new BadRequestException('No inviteId was provided');

    if (!this.gameService.correctInviteUsage(user.id, inviteId, false))
      throw new BadRequestException("Invite isn't meant for you");

    if (body.accepted === true) {
      await this.gameService.gameInviteAccepted(inviteId, user.id);
    } else {
      this.gameService.gameInviteDeclined(user.id);
    }

    return { message: 'Successfully responded to game invite' };
  }
}

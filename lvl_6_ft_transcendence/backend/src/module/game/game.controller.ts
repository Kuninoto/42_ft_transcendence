import { Controller, Get, Logger, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ExtractUser } from 'src/common/decorator/extract-user.decorator';
import { User } from 'src/entity';
import { UserStatsForLeaderboard } from 'types';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { UserStatsService } from '../user-stats/user-stats.service';

@ApiTags('game')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('game')
export class GameController {
  constructor(private readonly userStatsService: UserStatsService) {}

  private readonly logger: Logger = new Logger(GameController.name);

  /**
   * GET /api/game/leaderboard
   *
   * Returns leaderboard (UserStatsForLeaderboard[]) user at index 0 is the top scorer (descending order)
   */
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
}

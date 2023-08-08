import { Controller, Get, Inject, Req, UseGuards } from '@nestjs/common';
import { GameService } from './game.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { User } from 'src/entity';
import { UserStatsForLeaderboard } from 'src/common/types/user-stats-for-leaderboard.interface';
import { UserStatsService } from '../user-stats/user-stats.service';

@ApiTags('game')
@UseGuards(JwtAuthGuard)
@Controller('game')
export class GameController {
  constructor(private readonly userStatsService: UserStatsService) {}

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
    @Req() req: { user: User },
  ): Promise<UserStatsForLeaderboard[]> {
    return await this.userStatsService.getLeaderboard();
  }
}

import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserStatsForLeaderboard } from 'types';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
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
  public async getLeaderboard(): Promise<UserStatsForLeaderboard[]> {
    return await this.userStatsService.getLeaderboard();
  }
}

import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { GameService } from './game.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { NonNegativeIntPipe } from 'src/common/pipe/non-negative-int.pipe';
import { ErrorResponse } from 'src/common/types/error-response.interface';
import { UserProfile } from 'src/common/types/user-profile.interface';
import { User } from 'src/entity';

@ApiTags('game')
@UseGuards(JwtAuthGuard)
@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  /**
   * GET /api/game/leaderboard
   *
   * Returns leaderboar
   */

  /* @ApiOkResponse({
    description: "Returns leaderboard"
  })
  @Get('leaderboard')
  public async getUserProfileByUID(
    @Req() req: { user: User },
  ): {
  {

  } */
}

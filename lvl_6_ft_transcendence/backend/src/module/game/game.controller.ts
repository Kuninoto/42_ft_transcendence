import { Controller, UseGuards } from '@nestjs/common';
import { GameService } from './game.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('game')
@UseGuards(JwtAuthGuard)
@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  /**
   * GET /api/game/:gameId
   *
   */
  // @Get('/:gameId')
}

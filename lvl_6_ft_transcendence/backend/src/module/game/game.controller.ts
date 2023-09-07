import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Logger,
  UseGuards,
  ConflictException,
  BadRequestException
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiConflictResponse,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { ExtractUser } from 'src/common/decorator/extract-user.decorator';
import { User } from 'src/entity';
import {
  ErrorResponse,
  PlayerSide,
  RespondToGameInviteRequest,
  SendGameInviteRequest,
  SuccessResponse,
  UserStatsForLeaderboard
} from 'types';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ConnectionService } from '../connection/connection.service';
import { UserStatsService } from '../user-stats/user-stats.service';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { Player } from './Player';

@ApiTags('game')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('game')
export class GameController {
  constructor(
    private readonly userStatsService: UserStatsService,
    private readonly gameService: GameService,
    private readonly gameGateway: GameGateway,
    private readonly connectionService: ConnectionService,
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
  @ApiConflictResponse({ description:
    'If requesting user is in game or offline\n\
     If recipient is in game\n'})
  @ApiOkResponse({
    description:
      'Successfully sent game invite',
  })
  @Post('/invite')
  async sendGameInvite(
    @ExtractUser() user: User,
    @Body() body: SendGameInviteRequest,
  ): Promise<SuccessResponse | ErrorResponse> {
    if (this.gameService.isPlayerInQueueOrGame(user.id))
      throw new ConflictException('You cannot send a game invite while in a game');

    if (this.gameService.isPlayerInQueueOrGame(body.recipientUID))
      throw new ConflictException('Recipient is in game');

    const socketIdOfPlayer: string | undefined = this.connectionService.findSocketIdByUID(user.id);
    if (!socketIdOfPlayer)
      throw new ConflictException("You cannot send a game invite if you're offline");

    const newPlayer: Player = new Player(Number(user.id), socketIdOfPlayer);
    newPlayer.setPlayerSide(PlayerSide.LEFT);

    const inviteId: string = this.gameService.createGameInvite({
      recipientUID: body.recipientUID,
      sender: newPlayer,
    });

    this.gameGateway.emitInvitedToGameEvent(body.recipientUID, {
      inviteId: inviteId,
      inviterUID: Number(user.id),
    });

    return { message: 'Successfully sent game invite' };
  }

  @ApiOperation({ description: 'Respond to game invite' })
  @ApiOkResponse({
    description:
      'Successfully responded to game invite',
  })
  @Patch('/:inviteId/status')
  async respondToGameInvite(
    @ExtractUser() user: User,
    @Body() body: RespondToGameInviteRequest,
  ): Promise<SuccessResponse | ErrorResponse> {
    if (!this.gameService.correctInviteUsage(user.id, body.inviteId))
      throw new BadRequestException("Invite isn't meant for you");

    if (body.accepted === true) {
      const receiverSocketId: string | undefined =
        this.connectionService.findSocketIdByUID(user.id);

      if (!receiverSocketId)
        throw new ConflictException('You cannot accept a game invite while being offline');

      await this.gameService.gameInviteAccepted(body.inviteId, user.id, receiverSocketId);
    } else {
      this.gameService.gameInviteDeclined(body.inviteId);
    }

    return { message: 'Successfully responded to game invite' };
  }
}

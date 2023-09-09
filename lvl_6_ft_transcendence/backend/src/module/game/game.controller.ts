import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Logger,
  UseGuards,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { ExtractUser } from 'src/common/decorator/extract-user.decorator';
import { User } from 'src/entity';
import {
  ErrorResponse,
  GameInviteSentResponse,
  PlayerSide,
  RespondToGameInviteRequest,
  SendGameInviteRequest,
  SuccessResponse,
  UserStatsForLeaderboard,
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
  @ApiConflictResponse({
    description:
      'If requesting user is in game or offlineIf recipient is in game\n',
  })
  @ApiOkResponse({
    description: 'Successfully sent game invite',
  })
  @Post('/invite')
  async sendGameInvite(
    @ExtractUser() user: User,
    @Body() body: SendGameInviteRequest,
  ): Promise<GameInviteSentResponse | ErrorResponse> {
    if (this.gameService.isPlayerInQueueOrGame(user.id))
      throw new ConflictException(
        'You cannot send a game invite while in a game',
      );

    if (this.gameService.isPlayerInQueueOrGame(body.recipientUID))
      throw new ConflictException('Recipient is in game');

    const socketIdOfPlayer: string | undefined =
      this.connectionService.findSocketIdByUID(user.id);
    if (!socketIdOfPlayer)
      throw new ConflictException(
        "You cannot send a game invite if you're offline",
      );

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

    return { inviteId: inviteId };
  }

  @ApiOperation({ description: 'Respond to game invite' })
  @ApiBadRequestResponse({
    description: "If request is malformed or if invite isn't meant for the requesting user",
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
    if (!inviteId)
      throw new BadRequestException('No inviteId was provided');

    if (!this.gameService.correctInviteUsage(user.id, inviteId, false))
      throw new BadRequestException("Invite isn't meant for you");

    if (body.accepted === true) {
      const receiverSocketId: string | undefined =
        this.connectionService.findSocketIdByUID(user.id);

      if (!receiverSocketId) {
        throw new ConflictException(
          'You cannot accept a game invite while being offline',
          );
      }

      await this.gameService.gameInviteAccepted(
        inviteId,
        user.id,
        receiverSocketId,
      );
    } else {
      this.gameService.gameInviteDeclined(inviteId);
    }

    return { message: 'Successfully responded to game invite' };
  }

  @ApiOperation({ description: 'Delete game invite' })
  @ApiBadRequestResponse({
    description: "If invite isn't meant for the requesting user",
  })
  @ApiConflictResponse({
    description: 'If user accepts the invite but is offline',
  })
  @ApiNotFoundResponse({ description: 'If invite is not found' })
  @ApiOkResponse({
    description: 'Successfully deleted game invite',
  })
  @Delete('/:inviteId')
  async cancelGameInvite(
    @ExtractUser() user: User,
    @Param('inviteId') inviteId: string,
  ): Promise<SuccessResponse | ErrorResponse> {
    if (!inviteId)
      throw new BadRequestException('No inviteId was provided');

    if (!this.gameService.correctInviteUsage(user.id, inviteId, true))
      throw new BadRequestException("Invite isn't meant for you");

    this.gameService.cancelGameInvite(inviteId);

    return { message: 'Successfully deleted game invite' };
  }
}

import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { NonNegativeIntPipe } from 'src/common/pipe/non-negative-int.pipe';
import { User } from 'src/entity';
import { ErrorResponse, FriendshipStatus, SuccessResponse } from 'types';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { FriendshipsService } from './friendships.service';
import { FriendshipStatusUpdateValidationPipe } from './pipe/friendship-status-update-validation.pipe';

@ApiTags('friendships')
@ApiBearerAuth('Jwt')
@UseGuards(JwtAuthGuard)
@Controller('friendships')
export class FriendshipsController {
  constructor(private readonly friendshipsService: FriendshipsService) {}

  /**
   * POST /api/friendships/send-request/:receiverId
   *
   * Sends a friend request to the user which id=receiverId
   * - Checks if:
   *   - The sender is the receiver (self friend request)
   *   - The receiver exists
   *   - The sender is blocked by the receiver
   *   - The receiver is blocked by the sender (Must first unblock the receiver)
   *   - A friend request has already been made between those two users
   *   - They're friends already
   * And finally creates a new entry on the friendships table
   */
  @ApiOkResponse({
    description: 'Sends a friend request to the user which id=receiverId',
  })
  @ApiBadRequestResponse({
    description: 'If the sender == receiver i.e self friend-request',
  })
  @ApiForbiddenResponse({
    description:
      'If the sender is blocked by the receiver or if the receiver is blocked by the sender',
  })
  @ApiConflictResponse({
    description:
      "If there's already a friend request between the two users (sender & receiver) or if sender & receiver are already friends",
  })
  @HttpCode(HttpStatus.OK)
  @Post('send-request/:receiverId')
  public async sendFriendRequest(
    @Req() req: { user: User },
    @Param('receiverId', NonNegativeIntPipe) receiverUID: number,
  ): Promise<ErrorResponse | SuccessResponse> {
    return await this.friendshipsService.sendFriendRequest(
      req.user,
      receiverUID,
    );
  }

  /**
   * PATCH /api/friendships/:friendshipId/update
   *
   * Updates the friendship status according to the "newStatus"
   * field of the JSON sent on the body
   *
   * {
   *   "newStatus":"accepted" | "declined" | "unfriend"
   * }
   */
  @ApiOkResponse({
    description:
      "Updates the friendship status according to the \"newStatus\" field of the JSON sent on the body. Possible values: 'declined' | 'accepted' | 'unfriend' ",
  })
  @ApiNotFoundResponse({
    description: "If a friendship which id=friendshipId doesn't exist",
  })
  @ApiBadRequestResponse({
    description:
      'If the sender tries to update the friend request that he has sent',
  })
  @ApiBody({
    schema: {
      properties: {
        newStatus: {
          enum: Object.values(['declined', 'accepted', 'unfriend']),
          type: 'string',
        },
      },
      required: ['newStatus'],
      type: 'object',
    },
  })
  @Patch(':friendshipId/update')
  public async updateFriendshipStatus(
    @Req() req: { user: User },
    @Param('friendshipId', NonNegativeIntPipe) friendshipId: number,
    @Body(new FriendshipStatusUpdateValidationPipe())
    newStatus: FriendshipStatus,
  ): Promise<ErrorResponse | SuccessResponse> {
    return await this.friendshipsService.updateFriendshipStatus(
      req.user,
      friendshipId,
      newStatus,
    );
  }

  /****************************
   *           BLOCK           *
   *****************************/

  /**
   * POST /api/block/:userToBlockId
   *
   * @description Checks if:
   *   - The userToBlock exists
   *   - The user is trying to block himself
   *   - The userToBlock is already blocked
   * And finally blocks user which id=userToBlockId
   */
  @ApiOkResponse({
    description:
      'Estabilishes a block relationship between sender and the user which id=userToBlockId',
  })
  @ApiConflictResponse({
    description:
      'If user tries to block itself or if user which id=userToBlockId is already blocked',
  })
  @ApiNotFoundResponse({
    description: "If user with id=userToBlockId doesn't exist",
  })
  @HttpCode(HttpStatus.OK)
  @Post('block/:userToBlockId')
  public async blockUser(
    @Req() req: { user: User },
    @Param('userToBlockId', NonNegativeIntPipe) userToBlockId: number,
  ): Promise<ErrorResponse | SuccessResponse> {
    return await this.friendshipsService.blockUserByUID(
      req.user,
      userToBlockId,
    );
  }

  /**
   * DELETE /api/block/:userToUnblockId
   *
   * @description Unblocks uid=userToUnblockId
   */
  @ApiOkResponse({
    description:
      'Breaks the block relationship between sender and the user which id=userToUnblockId',
  })
  @ApiConflictResponse({
    description:
      'User which id=userToUnblockId is already unblocked or if the sender tries to unblock itself',
  })
  @ApiNotFoundResponse({
    description: "If user with id=userToUnblockId doesn't exist",
  })
  @Delete('block/:userToUnblockId')
  public async unblockUser(
    @Req() req: { user: User },
    @Param('userToUnblockId', NonNegativeIntPipe) userToUnblockId: number,
  ): Promise<ErrorResponse | SuccessResponse> {
    return await this.friendshipsService.unblockUserByUID(
      req.user,
      userToUnblockId,
    );
  }
}

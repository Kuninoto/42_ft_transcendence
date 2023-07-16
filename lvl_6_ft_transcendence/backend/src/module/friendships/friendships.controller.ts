import {
  Controller,
  UseGuards,
  Body,
  Req,
  Param,
  HttpCode,
  Patch,
  Post
} from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiForbiddenResponse, ApiBody, ApiNotFoundResponse, ApiConflictResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { NonNegativeIntPipe } from 'src/common/pipe/non-negative-int.pipe';
import { ErrorResponse } from 'src/common/types/error-response.interface';
import { SuccessResponse } from 'src/common/types/success-response.interface';
import { FriendshipStatus } from 'src/entity/friendship.entity';
import { User } from 'src/typeorm';
import { FriendshipStatusUpdateValidationPipe } from './pipe/friend-request-response-validation.pipe';
import { FriendshipsService } from './friendships.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@ApiTags('friendships')
@UseGuards(JwtAuthGuard)
@Controller('friendships')
export class FriendshipsController {
  constructor (
    private readonly friendshipsService: FriendshipsService,
  ) { }

  /**
  * POST /api/friendships/send-request/:receiverId
  * 
  * Sends a friend request to the user which id=receiverId
  * - Checks if:
  *   - receiverID == senderID (to not allow self requesting)
  *   - received has blocked the sender (cannot request if blocked)
  * And finally creates a new entry on the friendships table
  */
  @ApiOkResponse({ description: "Sends a friend request to the user which id=receiverId" })
  @ApiBadRequestResponse({ description: "If the sender == receiver i.e if the user tries to add itself as a friend" })
  @ApiForbiddenResponse({ description: "If the sender is blocked by the recipient" })
  @ApiConflictResponse({ description: "If there's already a friend request between the two users (sender & receiver)" })
  @ApiConflictResponse({ description: "If sender & receiver are already friends" })
  @HttpCode(200)
  @Post('send-request/:receiverId')
  public async sendFriendRequest(
    @Req() req: { user: User },
    @Param('receiverId', NonNegativeIntPipe) receiverUID: number
  ): Promise<SuccessResponse | ErrorResponse> {
    return await this.friendshipsService.sendFriendRequest(req.user, receiverUID);
  }

  /**
  * PATCH /api/friendships/:friendshipId/update
  * 
  * Updates the friendship status according to the "newStatus"
  * field of the JSON sent on the body
  * 
  * {
  *   "newStatus":"accepted" | "declined" | "unfriend" | "canceled"
  * }
  */
  @ApiOkResponse({ description: "Updates the friendship status according to the \"newStatus\" field of the JSON sent on the body" })
  @ApiNotFoundResponse({ description: "If a friendship which id=friendshipId doesn't exist" })
  @ApiBadRequestResponse({ description: "If the sender tries to update the friend request that he has sent" })
  @ApiBody({ schema: { type: 'object', required: ['newStatus'], properties: { newStatus: { type: 'string', enum: Object.values(FriendshipStatus) } } } })
  @Patch(':friendshipId/update')
  public async updateFriendshipStatus(
    @Req() req: { user: User },
    @Param('friendshipId', NonNegativeIntPipe) friendshipId: number,
    @Body(new FriendshipStatusUpdateValidationPipe) newStatus: FriendshipStatus
  ): Promise<SuccessResponse | ErrorResponse> {
    return await this.friendshipsService.updateFriendshipStatus(req.user, friendshipId, newStatus);
  }
}

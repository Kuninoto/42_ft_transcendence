import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { NewFriendshipStatus } from 'types/friendship/new-friendship-status.enum';

export class FriendshipStatusUpdationRequest {
  @ApiProperty()
  @IsEnum(NewFriendshipStatus)
  newStatus: NewFriendshipStatus;
}

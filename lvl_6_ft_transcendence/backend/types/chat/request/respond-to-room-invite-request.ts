import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsUUID } from 'class-validator';
import { UUID } from 'crypto';

export class RespondToRoomInviteRequest {
  @ApiProperty()
  @IsUUID()
  readonly inviteId: UUID;

  @ApiProperty()
  @IsBoolean()
  readonly accepted: boolean;
}

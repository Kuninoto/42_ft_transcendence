import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsUUID } from 'class-validator';

export class RespondToRoomInviteRequest {
  @ApiProperty()
  @IsUUID()
  readonly inviteId: string;

  @ApiProperty()
  @IsBoolean()
  readonly accepted: boolean;
}

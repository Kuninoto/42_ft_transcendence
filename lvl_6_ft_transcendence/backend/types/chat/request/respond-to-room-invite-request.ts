import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class RespondToRoomInviteRequest {
  @ApiProperty()
  @IsString()
  readonly inviteId: string;

  @ApiProperty()
  @IsBoolean()
  readonly accepted: boolean;
}

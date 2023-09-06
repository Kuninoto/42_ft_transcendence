import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsBoolean } from 'class-validator';

export class RespondToRoomInviteRequest {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  readonly inviteId: number;

  @ApiProperty()
  @IsBoolean()
  readonly accepted: boolean;
}

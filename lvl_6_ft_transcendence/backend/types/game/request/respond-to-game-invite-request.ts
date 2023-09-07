import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsBoolean } from 'class-validator';

export class RespondToGameInviteRequest {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  readonly inviteId: string;

  @ApiProperty()
  @IsBoolean()
  readonly accepted: boolean;
}

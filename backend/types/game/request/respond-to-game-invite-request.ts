import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class RespondToGameInviteRequest {
  @ApiProperty()
  @IsBoolean()
  readonly accepted: boolean;
}

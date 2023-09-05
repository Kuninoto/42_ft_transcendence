import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class PossibleInvitesRequest {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  friendUID: number;
}

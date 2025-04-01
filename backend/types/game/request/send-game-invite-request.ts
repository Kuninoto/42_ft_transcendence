import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class SendGameInviteRequest {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  readonly receiverUID: number;
}

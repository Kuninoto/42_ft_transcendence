import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class InviteToRoomRequestDTO {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  readonly receiverUID: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  readonly roomId: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class RemoveRoomPasswordRequest {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  readonly roomId: number;
}

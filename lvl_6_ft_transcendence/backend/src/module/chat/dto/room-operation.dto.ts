import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class RoomOperationDTO {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  readonly roomId: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  readonly userId: number;
}

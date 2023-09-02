import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class RemoveRoomPasswordRequestDTO {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  roomId: number;
}

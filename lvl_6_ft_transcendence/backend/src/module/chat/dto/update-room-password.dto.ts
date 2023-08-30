import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString } from 'class-validator';

export class UpdateRoomPasswordDTO {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  readonly roomId: number;

  @ApiProperty()
  @IsString()
  readonly newPassword: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class JoinRoomDTO {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  readonly roomId: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly password?: string;
}

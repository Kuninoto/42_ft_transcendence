import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class JoinRoomRequest {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly password?: string;
}

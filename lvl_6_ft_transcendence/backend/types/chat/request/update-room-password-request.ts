import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateRoomPasswordRequest {
  @ApiProperty()
  @IsString()
  readonly newPassword: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UsernameUpdationRequest {
  @ApiProperty()
  @IsString()
  newUsername: string;
}

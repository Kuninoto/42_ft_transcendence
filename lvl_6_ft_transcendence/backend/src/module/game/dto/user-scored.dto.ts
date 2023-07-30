import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UserScoredDTO {
  @ApiProperty()
  @IsString()
  gameRoomId: string;
}

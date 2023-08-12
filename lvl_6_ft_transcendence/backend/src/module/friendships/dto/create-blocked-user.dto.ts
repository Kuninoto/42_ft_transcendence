import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { User } from 'src/typeorm/index';

export class CreateBlockedUsertDTO {
  @ApiProperty()
  @IsNotEmpty()
  readonly user_who_blocked: User;

  @ApiProperty()
  @IsNotEmpty()
  readonly blockedUser: User;
}

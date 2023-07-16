import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { User } from 'src/typeorm';

export class CreateBlockedUsertDTO {
  @ApiProperty()
  @IsNotEmpty()
  readonly userWhoBlocked: User;

  @ApiProperty()
  @IsNotEmpty()
  readonly blockedUser: User;
}

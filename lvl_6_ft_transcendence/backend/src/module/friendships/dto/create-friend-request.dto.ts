import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { User } from 'src/typeorm/index';

export class CreateFriendRequestDTO {
  @ApiProperty()
  @IsNotEmpty()
  readonly sender: User;

  @ApiProperty()
  @IsNotEmpty()
  readonly receiver: User;

  @ApiProperty()
  readonly status: string = 'pending';
}

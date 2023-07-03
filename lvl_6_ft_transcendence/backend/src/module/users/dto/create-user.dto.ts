import { ApiProperty } from '@nestjs/swagger';
import { IsAlpha, IsAlphanumeric, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsAlphanumeric()
  readonly name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly avatar_url: string;
}

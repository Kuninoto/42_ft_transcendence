import { ApiProperty } from '@nestjs/swagger';
import { IsAlphanumeric, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly avatar_url: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsAlphanumeric()
  readonly intra_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly intra_profile_url: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsAlphanumeric()
  readonly name: string;
}

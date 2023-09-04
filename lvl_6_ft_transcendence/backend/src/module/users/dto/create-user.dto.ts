import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsAlpha } from 'class-validator';

export class CreateUserDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly avatar_url: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsAlpha()
  readonly intra_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly intra_profile_url: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsAlpha()
  readonly name: string;
}

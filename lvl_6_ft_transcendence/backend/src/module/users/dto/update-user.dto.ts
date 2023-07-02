import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateUserDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  readonly name?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  readonly avatar_url?: string;

  @IsNotEmpty()
  @IsOptional()
  readonly secret_2fa?: string;

  @IsNotEmpty()
  @IsOptional()
  last_updated_at?: Date;
}

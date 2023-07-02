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

  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  readonly has_2fa?: boolean;

  @IsNotEmpty()
  last_updated_at?: Date;
}

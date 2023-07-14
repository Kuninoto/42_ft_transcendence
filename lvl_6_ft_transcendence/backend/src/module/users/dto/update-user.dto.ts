import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { UserStatus } from 'src/entity/user.entity';

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
  readonly status?: UserStatus;

  @IsNotEmpty()
  @IsOptional()
  last_updated_at?: Date;
}

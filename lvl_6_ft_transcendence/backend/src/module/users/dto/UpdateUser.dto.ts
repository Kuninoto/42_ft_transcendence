import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateUserDTO {
  @IsNotEmpty()
  @IsOptional()
  readonly name: string;

  @IsNotEmpty()
  @IsOptional()
  readonly avatar_url: string;

  @IsNotEmpty()
  last_updated_at: Date;
}

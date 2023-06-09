import { IsNotEmpty, IsOptional, MinLength } from "class-validator";

export class UpdateUserDTO {
  @IsNotEmpty()
  @IsOptional()
  @MinLength(3)
  readonly name: string;

  @IsNotEmpty()
  @IsOptional()
  readonly hashed_pass: string;
}

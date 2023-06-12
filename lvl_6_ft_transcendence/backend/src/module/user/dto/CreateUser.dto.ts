import { IsNotEmpty, MinLength } from "class-validator";

export class CreateUserDTO {
  @IsNotEmpty()
  @MinLength(3)
  readonly name: string;

  @IsNotEmpty()
  readonly avatar_endpoint: string;
}

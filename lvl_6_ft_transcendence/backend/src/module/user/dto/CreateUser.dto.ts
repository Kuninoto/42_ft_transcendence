import { IsNotEmpty } from "class-validator";

export class CreateUserDTO {
  @IsNotEmpty()
  readonly name: string;

  @IsNotEmpty()
  readonly access_token: string;

  @IsNotEmpty()
  readonly avatar_url: string;
}

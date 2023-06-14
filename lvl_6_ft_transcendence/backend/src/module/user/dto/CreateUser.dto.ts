import { IsNotEmpty } from "class-validator";

export class CreateUserDTO {
  @IsNotEmpty()
  readonly name: string;

  @IsNotEmpty()
  readonly access_token: string;

  @IsNotEmpty()
  readonly intra_photo_url: string;
}

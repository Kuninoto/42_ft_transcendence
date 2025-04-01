import { ApiProperty } from '@nestjs/swagger';

export class AvatarUpdationRequest {
  @ApiProperty()
  readonly avatar: BinaryData;
}

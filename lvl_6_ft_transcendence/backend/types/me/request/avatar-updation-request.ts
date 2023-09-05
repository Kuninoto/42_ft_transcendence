import { ApiProperty } from '@nestjs/swagger';

export class AvatarUpdationRequest {
  @ApiProperty()
  avatar: BinaryData;
}

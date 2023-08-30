import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsPositive, IsString } from 'class-validator';
import { ChatRoomType } from 'types';

export class RoomInviteDTO {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  readonly inviterId: number;

  @ApiProperty()
  @IsString()
  readonly roomName: string;

  @ApiProperty()
  @IsEnum(ChatRoomType)
  readonly roomType: ChatRoomType;
}

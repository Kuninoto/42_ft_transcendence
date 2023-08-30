import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ChatRoomType } from 'types';

export class CreateRoomDTO {
  @ApiProperty()
  @IsString()
  readonly name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly password?: string;

  @ApiProperty()
  @IsEnum(ChatRoomType)
  readonly type: ChatRoomType;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ChatRoomType } from 'types/chat/chat-room-type.enum';

export class CreateRoomRequest {
  @ApiProperty()
  @IsString()
  readonly name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly password?: string;

  @ApiProperty({ enum: ChatRoomType })
  @IsEnum(ChatRoomType)
  readonly type: ChatRoomType;
}

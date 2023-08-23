import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ChatRoomType } from 'types';

export class CreateRoomDTO {
  @IsString()
  readonly name: string;

  @IsString()
  @IsOptional()
  readonly password?: string;

  @IsEnum(ChatRoomType)
  readonly type: ChatRoomType;
}

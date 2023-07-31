import { GameType } from 'src/common/types/game-type.enum';
import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGameDTO {
  @ApiProperty()
  @IsString()
  room_id: string;

  @ApiProperty()
  @IsEnum(GameType)
  game_type: GameType;
}

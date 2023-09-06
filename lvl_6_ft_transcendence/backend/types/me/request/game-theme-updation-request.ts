import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { GameThemes } from 'types/game/game-themes.enum';

export class GameThemeUpdationRequest {
  @ApiProperty({ enum: GameThemes})
  @IsEnum(GameThemes)
  readonly newGameTheme: GameThemes;
}

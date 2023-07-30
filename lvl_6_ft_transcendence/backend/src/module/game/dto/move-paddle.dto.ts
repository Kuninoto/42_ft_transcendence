import { IsNumber, IsString, Length, Max, Min } from 'class-validator';
import { CANVAS_HEIGHT } from '../game-data';

export class MoveBarDTO {
  @IsString()
  @Length(43, 43)
  gameRoomId: string;

  @IsNumber()
  @Max(CANVAS_HEIGHT)
  @Min(0)
  y: number;
}

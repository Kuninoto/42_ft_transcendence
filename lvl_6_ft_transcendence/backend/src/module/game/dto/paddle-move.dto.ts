import { IsNumber, IsString, Max, Min } from 'class-validator';
import { CANVAS_HEIGHT } from '../GameRoom';

export class PaddleMoveDTO {
  @IsString()
  gameRoomId: string;

  @IsNumber()
  @Min(0)
  @Max(CANVAS_HEIGHT)
  newY: number;
}

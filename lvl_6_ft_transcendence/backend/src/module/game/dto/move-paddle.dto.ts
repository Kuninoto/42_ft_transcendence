import { IsNumber, IsString, Length, Max, Min } from 'class-validator';

// !TODO
// Assert this value with the real value
// and perhaps switch this to a more appropriate location
const CANVAS_MAX_HEIGHT = 800;

export class MoveBarDTO {
  @IsString()
  @Length(43, 43)
  gameRoomId: string;

  @IsNumber()
  @Max(CANVAS_MAX_HEIGHT)
  @Min(0)
  y: number;
}

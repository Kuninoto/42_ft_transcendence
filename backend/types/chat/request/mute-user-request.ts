import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsPositive } from 'class-validator';
import { MuteDuration } from 'types/chat/mute-duration.enum';

export class MuteUserRequest {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  readonly userId: number;

  @ApiProperty({ enum: MuteDuration })
  @IsEnum(MuteDuration)
  readonly duration: MuteDuration;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsPositive } from 'class-validator';
import { MuteDuration } from 'types';

export class MuteUserRequestDTO {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  readonly roomId: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  readonly userId: number;

  @ApiProperty()
  @IsEnum(MuteDuration)
  readonly duration: MuteDuration;
}

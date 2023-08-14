import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class OtpDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  otp: string;
}

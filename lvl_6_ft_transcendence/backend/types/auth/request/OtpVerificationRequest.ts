import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class OtpVerificationRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  otp: string;
}

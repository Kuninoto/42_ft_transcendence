import { JwtModuleOptions } from '@nestjs/jwt';

export const JwtOption: JwtModuleOptions = {
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
};

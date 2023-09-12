import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const AppCorsOption: CorsOptions = {
  methods: ['GET', 'POST', 'DELETE', 'PATCH'],
  origin: process.env.FRONTEND_URL,
  credentials: true,
};

export const GatewayCorsOption: CorsOptions = {
  methods: ['GET', 'POST'],
  origin: process.env.FRONTEND_URL,
  credentials: true,
};

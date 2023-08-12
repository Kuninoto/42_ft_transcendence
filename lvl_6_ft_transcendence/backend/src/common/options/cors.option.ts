import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const AppCorsOption: CorsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'PATCH'],
};

export const GatewayCorsOption: CorsOptions = {
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST'],
  allowedHeaders: ['content-type'],
};

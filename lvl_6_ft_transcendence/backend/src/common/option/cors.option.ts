import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const AppCorsOption: CorsOptions = {
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'PATCH'],
  // TOOD
  // allowedHeaders: ['Authorization', 'Content-Type'],
  origin: process.env.FRONTEND_URL,
};

export const GatewayCorsOption: CorsOptions = {
  methods: ['GET', 'POST'],
  origin: process.env.FRONTEND_URL,
};

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as session from 'express-session';
import * as passport from 'passport';
import { AppModule } from './app.module';
import { AppCorsOption } from './common/options/cors.option';
import { Passport42ExceptionFilter } from './module/auth/filter/passport42-exception.filter';

console.log('EXPRESS_SESSION_SECRET= ' + process.env.EXPRESS_SESSION_SECRET);

function checkRequiredEnvVariables(): void {
  const RED: string = '\x1b[31m';
  const RESET: string = '\x1b[0m';

  const requiredEnvVariables = [
    'POSTGRES_HOST',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_DB',
    'FRONTEND_URL',
    'BACKEND_URL',
    'INTRA_CLIENT_UID',
    'INTRA_CLIENT_SECRET',
    'INTRA_REDIRECT_URI',
    'GOOGLE_AUTH_APP_NAME',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'EXPRESS_SESSION_SECRET',
  ];

  const missingVariables: string[] = requiredEnvVariables.filter(
    (variable) => !process.env[variable],
  );

  if (missingVariables.length > 0) {
    console.error(
      `${RED}Missing environment variables: "${missingVariables.join(
        '", "',
      )}"\nAdd them to your .env file and restart the app${RESET}`,
    );
    process.exit(1);
  }
}

async function bootstrap() {
  const logger: Logger = new Logger('NestApplication');

  checkRequiredEnvVariables();

  const app: NestExpressApplication =
    await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['verbose'],
    });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Transcendence API')
    .setDescription('API for the transcendence project')
    .setVersion('1.0')
    .addTag('Transcendence')
    //  .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('help', app, document);

  app.enableCors(AppCorsOption);

  const oneDay: number = 86400000;
  app.use(
    session({
      cookie: {
        maxAge: oneDay,
        // We'll be using HTTP
        secure: false,
        httpOnly: true,
      },
      secret: process.env.EXPRESS_SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new Passport42ExceptionFilter());
  app.setGlobalPrefix('api');

  await app.listen(3000, () => logger.log('Listening on port 3000'));
}

bootstrap();

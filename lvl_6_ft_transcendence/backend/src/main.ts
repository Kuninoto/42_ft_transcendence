import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
  DocumentBuilder,
  OpenAPIObject,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import * as session from 'express-session';
import helmet from 'helmet';
import * as passport from 'passport';
import { AppModule } from './app.module';
import { AppCorsOption } from './common/option/cors.option';
import { Passport42ExceptionFilter } from './module/auth/filter/passport42-exception.filter';

console.log('EXPRESS_SESSION_SECRET= ' + process.env.EXPRESS_SESSION_SECRET);

function ensureRequiredEnvVariables(): void {
  const RED: string = '\x1b[31m';
  const RESET: string = '\x1b[0m';

  const requiredEnvVariables: string[] = [
    'POSTGRES_HOST',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_DB',
    'FRONTEND_URL',
    'BACKEND_URL',
    'BACKEND_PORT',
    'INTRA_CLIENT_UID',
    'INTRA_CLIENT_SECRET',
    'INTRA_REDIRECT_URI',
    'GOOGLE_AUTH_APP_NAME',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'EXPRESS_SESSION_SECRET',
  ];

  const missingVariables: string[] = requiredEnvVariables.filter(
    (variable: string): boolean => !process.env[variable],
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

function configureSwagger(app: NestExpressApplication): void {
  const swaggerConfig: Omit<OpenAPIObject, 'paths'> = new DocumentBuilder()
    .setTitle('ft_transcendence API')
    .setDescription('API for the ft_transcendence project')
    .setVersion('1.0')
    .addTag('ft_transcendence')
    .build();

  const document: OpenAPIObject = SwaggerModule.createDocument(
    app,
    swaggerConfig,
  );

  const HEX_NORDIC_BLUE: string = '#1c4966';
  const options: SwaggerCustomOptions = {
    customfavIcon: '../public/swagger/favicon.ico',
    customSiteTitle: 'ft_transcendence docs', //add site title to swagger for nice SEO
    customCss: `
      .topbar-wrapper img {content:url(\'../public/swagger/favicon.png\'); width:200px; height:auto;}
      .swagger-ui {
        background-color: ${HEX_NORDIC_BLUE}
        color: #ffffff
      }
    `,
    swaggerOptions: { persistAuthorization: true },
  };

  SwaggerModule.setup('help', app, document, options);
}

async function bootstrap(): Promise<void> {
  ensureRequiredEnvVariables();

  const logger: Logger = new Logger('NestApplication');

  const app: NestExpressApplication =
    await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['verbose'],
      cors: AppCorsOption,
    });

  // Only enable Swagger on dev mode
  if (process.env.NODE_ENV === 'dev') configureSwagger(app);

  const oneDayInMs: number = 60 * 60 * 24 * 1000;
  app.use(
    session({
      cookie: {
        httpOnly: true,
        maxAge: oneDayInMs,
        // We'll be using HTTP
        secure: false,
      },
      resave: false,
      saveUninitialized: false,
      secret: process.env.EXPRESS_SESSION_SECRET,
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new Passport42ExceptionFilter());
  app.setGlobalPrefix('api');

  await app.listen(parseInt(process.env.BACKEND_PORT), () =>
    logger.log(`Listening at ${process.env.BACKEND_URL}/api`),
  );
}

bootstrap();

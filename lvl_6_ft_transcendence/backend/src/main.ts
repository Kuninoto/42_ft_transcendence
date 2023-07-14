import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// !TODO
// Review cors utility
import * as cors from 'cors';
import * as session from 'express-session';
import * as passport from 'passport';

console.log("EXPRESS_SESSION_SECRET= " + process.env.EXPRESS_SESSION_SECRET);

function checkRequiredEnvVariables() {
  const requiredEnvVariables = [
    "POSTGRES_HOST",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "POSTGRES_DB",
    "FRONTEND_URL",
    "INTRA_CLIENT_UID",
    "INTRA_CLIENT_SECRET",
    "INTRA_REDIRECT_URI",
    "GOOGLE_AUTH_APP_NAME",
    "JWT_SECRET",
    "JWT_EXPIRES_IN",
    "EXPRESS_SESSION_SECRET",
  ];

  const missingVariables = requiredEnvVariables.filter(
    (variable) => !process.env[variable]
  );

  if (missingVariables.length > 0) {
    console.error(
      `Missing environment variables: ${missingVariables.join(', ')}`
    );
    process.exit(1);
  }
}

async function bootstrap() {
  checkRequiredEnvVariables();

  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Transcendence API')
    .setDescription('API for transcendence project')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('help', app, document);

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'PATCH'],
  });

  const oneDay: number = 86400000;
  app.use(
    session({
      cookie: {
        maxAge: oneDay,
      },
      secret: process.env.EXPRESS_SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix('api');

  await app.listen(3000, () => console.log('Listening on port 3000'));
}

bootstrap();

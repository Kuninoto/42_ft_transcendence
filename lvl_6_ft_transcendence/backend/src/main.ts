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

async function bootstrap() {
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

  app.use(
    session({
      secret: process.env.EXPRESS_SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());

  app.useGlobalPipes(new ValidationPipe());

// app.setGlobalPrefix('api');
  await app.listen(3000);
}

bootstrap();

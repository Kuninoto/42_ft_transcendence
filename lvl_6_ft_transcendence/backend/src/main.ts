import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// !TODO
// remove this, it's just for testing purposes
// to allow different hosts to communicate
// i.e a test frontend will run on localhost:8080
// and the backend on localhost:3000
// this allows them to communicate
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'PATCH', 'PUT'],
  });

  const config = new DocumentBuilder()
    .setTitle('Transcendence API')
    .setDescription('API for transcendence project')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('help', app, document);

  app.useGlobalPipes(new ValidationPipe());
// app.setGlobalPrefix('api');
  await app.listen(3000);
}

bootstrap();

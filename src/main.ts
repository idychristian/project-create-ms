import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }));
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');
  const port = process.env.PROJECT_PORT;
  // await app.listen(process.env.PORT ?? 3000);
  await app.listen(port, () => console.log(`Server running on port: ${port}`));
}
bootstrap();

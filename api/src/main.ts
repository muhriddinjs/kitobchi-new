import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './app-setup';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Behind Render's proxy req.ip is the proxy address for everyone, which
  // would make the per-IP throttler a single global bucket. Trust the first
  // proxy hop so the real client IP is used.
  app.set('trust proxy', 1);

  configureApp(app);

  const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: allowedOrigins, credentials: true });

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();

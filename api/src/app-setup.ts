import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

/**
 * Request-pipeline configuration shared by the real server and the e2e
 * tests. Kept here rather than inline in `main.ts` so tests can't quietly
 * run without the validation pipe or the error filter and pass on
 * behaviour production doesn't have.
 */
export function configureApp(app: INestApplication): void {
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
}

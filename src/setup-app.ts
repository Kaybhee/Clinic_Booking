import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json } from 'express';
import { apiKeyMiddleware } from './modules/auth/api-key.middleware';

/**
 * Shared by main.ts and the e2e tests so both run exactly the same pipeline.
 * The app must be created with `{ bodyParser: false }`: the API key is checked first,
 * and the JSON body is only parsed for requests that are allowed in.
 */
export function configureApp(app: INestApplication, apiKey: string) {
  app.use(apiKeyMiddleware(apiKey));
  app.use(json({ limit: '256kb' }));
  app.enableCors({ origin: true, exposedHeaders: ['Retry-After'] });

  const config = new DocumentBuilder()
    .setTitle('Clinic Booking API')
    .setDescription('Book clinic appointment slots.')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
    .build();
  SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, config));
}

export function readApiKey(config: ConfigService): string {
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  const key = config.get<string>(`${env}.apiKey`) ?? process.env.API_KEY;
  if (!key) throw new Error('API_KEY is not set. Refusing to start without an API key.');
  return key;
}

import './dns-fix'
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configureApp, readApiKey } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const configService = app.get(ConfigService);

  configureApp(app, readApiKey(configService));

  const port = Number(process.env.PORT) || configService.get<number>('PORT') || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Clinic booking API is running on port: ${port}`);
}

bootstrap();

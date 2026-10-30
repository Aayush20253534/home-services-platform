import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const proxyHops = Number(process.env.TRUST_PROXY_HOPS ?? '0');
  if (!Number.isInteger(proxyHops) || proxyHops < 0 || proxyHops > 3) {
    throw new Error('TRUST_PROXY_HOPS must be an integer from 0 to 3');
  }
  if (proxyHops > 0) {
    // Configure only for a deployment behind a trusted reverse proxy.
    app.getHttpAdapter().getInstance().set('trust proxy', proxyHops);
  }
  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(',').map((x) => x.trim()),
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'OPTIONS'],
  });

  const port = Number(process.env.API_PORT ?? '4000');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('API_PORT must be an integer between 1 and 65535');
  }
  await app.listen(port, '0.0.0.0');
}

void bootstrap();

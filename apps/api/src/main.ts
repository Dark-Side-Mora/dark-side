import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: [
      'https://ci-insight.netlify.app',
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-ci-insight-token'],
  });

  // Set Global Prefix for Path-Based Routing
  app.setGlobalPrefix('ci-insight');

  console.log('[Bootstrap] API Server starting...');
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`[Bootstrap] API Server listening on port ${port}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});

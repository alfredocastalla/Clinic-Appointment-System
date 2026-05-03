import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    console.log('[INFO] Starting Clinic Appointment System...');
    const app = await NestFactory.create(AppModule);
    console.log('[INFO] AppModule created successfully');

    app.enableCors();
    console.log('[INFO] CORS enabled');

    const port = process.env.PORT ?? 3001;
    await app.listen(port);
    console.log(`[INFO] ✅ Server is running on http://localhost:${port}`);
  } catch (error) {
    console.error('[ERROR] Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();

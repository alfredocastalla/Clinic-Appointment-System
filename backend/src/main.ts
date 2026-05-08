import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  try {
    console.log('[INFO] Starting Clinic Appointment System...');
    const app = await NestFactory.create(AppModule);
    console.log('[INFO] AppModule created successfully');

    app.enableCors();
    console.log('[INFO] CORS enabled');

    const port = 3001;
    const host = '127.0.0.1';

    await app.listen(port, host);
    console.log(`[INFO] ✅ Server is running on http://localhost:${port}`);
  } catch (error) {
    console.error('[ERROR] Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();

import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: join(__dirname, '..', '.env') });

import { UsersModule } from './users/users.module';
import { DoctorsModule } from './doctors/doctors.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AuthModule } from './auth/auth.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

const dbType = (process.env.DB_TYPE || 'sqlite').toLowerCase();

const typeOrmConfig: TypeOrmModuleOptions =
  dbType === 'sqlite'
    ? {
        type: 'sqlite',
        database: process.env.DB_NAME || 'database.sqlite',
        autoLoadEntities: true,
        synchronize: true,
      }
    : {
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'clinic_appointment',
        autoLoadEntities: true,
        synchronize: true,
      };

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend', 'dist'),
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    UsersModule,
    DoctorsModule,
    AppointmentsModule,
    AuthModule,
    PaymentsModule,
    NotificationsModule,
    PrescriptionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

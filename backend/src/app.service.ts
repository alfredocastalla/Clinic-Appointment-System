import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UsersService } from './users/users.service';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly usersService: UsersService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@clinic.local';
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';
    const existingAdmin = await this.usersService.findByEmail(adminEmail);

    if (!existingAdmin) {
      await this.usersService.create({
        name: 'System Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        location: 'Main Office',
      });
    }
  }

  async getHealth() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', dbConnected: true };
    } catch (error) {
      return {
        status: 'error',
        dbConnected: false,
        message: error instanceof Error ? error.message : 'Database connection failed',
      };
    }
  }
}

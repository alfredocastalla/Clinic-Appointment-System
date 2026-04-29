import { Injectable, OnModuleInit } from '@nestjs/common';
import { UsersService } from './users/users.service';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly usersService: UsersService) {}

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

  getHealth() {
    return { status: 'ok' };
  }
}

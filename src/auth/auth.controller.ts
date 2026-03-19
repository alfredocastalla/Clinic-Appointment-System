import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register/user')
  async registerUser(@Body() body: { name: string; email: string; password: string }) {
    return this.authService.registerUser(body);
  }

  @Post('register/doctor')
  async registerDoctor(@Body() body: { name: string; email: string; password: string; specialization: string }) {
    return this.authService.registerDoctor(body);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string; role: 'user' | 'doctor' }) {
    return this.authService.login(body.email, body.password, body.role);
  }
}

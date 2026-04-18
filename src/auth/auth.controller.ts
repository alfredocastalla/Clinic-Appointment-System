import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';

type RegisterUserBody = {
  name: string;
  email: string;
  password: string;
  location?: string;
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register/user')
  async registerUser(@Body() body: RegisterUserBody) {
    return this.authService.registerUser(body);
  }

  @Post('register/doctor')
  async registerDoctor(@Body() body: { name: string; email: string; password: string; specialization: string; address?: string }) {
    return this.authService.registerDoctor(body);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: { email: string; password: string; role: 'user' | 'doctor' }) {
    return this.authService.login(body.email, body.password, body.role);
  }
}

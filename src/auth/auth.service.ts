import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { DoctorsService } from '../doctors/doctors.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private doctorsService: DoctorsService,
    private jwtService: JwtService,
  ) {}

  async registerUser(data: { name: string; email: string; password: string }) {
    const existingUser = await this.usersService.findByEmail(data.email);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }
    const user = await this.usersService.create({ ...data, role: 'user' });
    const payload = { sub: user.id, email: user.email, role: 'user' };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, name: user.name, email: user.email, role: 'user' },
    };
  }

  async registerDoctor(data: { name: string; email: string; password: string; specialization: string }) {
    const existingDoctor = await this.doctorsService.findByEmail(data.email);
    if (existingDoctor) {
      throw new UnauthorizedException('Doctor already exists');
    }
    const doctor = await this.doctorsService.create(data);
    const payload = { sub: doctor.id, email: doctor.email, role: 'doctor' };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: doctor.id, name: doctor.name, email: doctor.email, specialization: doctor.specialization, role: 'doctor' },
    };
  }

  async login(email: string, password: string, role: 'user' | 'doctor') {
    let entity;
    if (role === 'user') {
      entity = await this.usersService.findByEmail(email);
    } else {
      entity = await this.doctorsService.findByEmail(email);
    }

    if (!entity) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, entity.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: entity.id, email: entity.email, role };
    return {
      access_token: this.jwtService.sign(payload),
      user: role === 'user' ? { id: entity.id, name: entity.name, email: entity.email, role } : { id: entity.id, name: entity.name, email: entity.email, specialization: entity.specialization, role },
    };
  }
}

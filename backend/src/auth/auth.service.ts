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

  async registerUser(data: {
    name: string;
    email: string;
    password: string;
    location?: string;
  }) {
    const existingUser = await this.usersService.findByEmail(data.email);
    const existingDoctor = await this.doctorsService.findByEmail(data.email);
    if (existingUser || existingDoctor) {
      throw new UnauthorizedException('Email already registered');
    }
    const user = await this.usersService.create({ ...data, role: 'user' });
    const payload = { sub: user.id, email: user.email, role: 'user' };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'user',
        location: user.location,
      },
    };
  }

  async registerDoctor(data: {
    name: string;
    email: string;
    password: string;
    specialization: string;
    address?: string;
  }) {
    const existingDoctor = await this.doctorsService.findByEmail(data.email);
    const existingUser = await this.usersService.findByEmail(data.email);
    if (existingDoctor || existingUser) {
      throw new UnauthorizedException('Email already registered');
    }
    const doctor = await this.doctorsService.create(data);
    const payload = { sub: doctor.id, email: doctor.email, role: 'doctor' };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
        address: doctor.address,
        role: 'doctor',
      },
    };
  }

  async login(
    email: string,
    password: string,
    role: 'user' | 'doctor' | 'admin',
  ) {
    let entity;
    if (role === 'doctor') {
      entity = await this.doctorsService.findByEmail(email);
    } else {
      entity = await this.usersService.findByEmail(email);
    }

    if (!entity) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (role === 'admin' && entity.role !== 'admin') {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (role === 'user' && entity.role === 'admin') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, entity.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: entity.id, email: entity.email, role };
    return {
      access_token: this.jwtService.sign(payload),
      user:
        role === 'doctor'
          ? {
              id: entity.id,
              name: entity.name,
              email: entity.email,
              specialization: entity.specialization,
              address: entity.address,
              role,
            }
          : role === 'admin'
            ? {
                id: entity.id,
                name: entity.name,
                email: entity.email,
                role: 'admin',
                location: entity.location,
              }
            : {
                id: entity.id,
                name: entity.name,
                email: entity.email,
                role: 'user',
                location: entity.location,
              },
    };
  }
}

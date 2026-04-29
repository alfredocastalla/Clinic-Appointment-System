import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { DoctorsService } from '../doctors/doctors.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let doctorsService: jest.Mocked<DoctorsService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    const mockDoctorsService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: DoctorsService, useValue: mockDoctorsService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    doctorsService = module.get(DoctorsService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const userData = { name: 'John Doe', email: 'john@example.com', password: 'password' };
      const createdUser = { id: 1, ...userData, role: 'user' };
      const token = 'jwt-token';

      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(createdUser);
      jwtService.sign.mockReturnValue(token);

      const result = await service.registerUser(userData);

      expect(usersService.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(usersService.create).toHaveBeenCalledWith({ ...userData, role: 'user' });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: createdUser.id, email: createdUser.email, role: 'user' });
      expect(result).toEqual({
        access_token: token,
        user: { id: createdUser.id, name: createdUser.name, email: createdUser.email, role: 'user' },
      });
    });

    it('should throw error if user already exists', async () => {
      const userData = { name: 'John Doe', email: 'john@example.com', password: 'password' };
      usersService.findByEmail.mockResolvedValue({ id: 1 } as any);

      await expect(service.registerUser(userData)).rejects.toThrow(UnauthorizedException);
      expect(usersService.findByEmail).toHaveBeenCalledWith(userData.email);
    });
  });

  describe('registerDoctor', () => {
    it('should register a new doctor successfully', async () => {
      const doctorData = { name: 'Dr. Smith', email: 'smith@example.com', password: 'password', specialization: 'Cardiology' };
      const createdDoctor = { id: 1, ...doctorData };
      const token = 'jwt-token';

      doctorsService.findByEmail.mockResolvedValue(null);
      doctorsService.create.mockResolvedValue(createdDoctor);
      jwtService.sign.mockReturnValue(token);

      const result = await service.registerDoctor(doctorData);

      expect(doctorsService.findByEmail).toHaveBeenCalledWith(doctorData.email);
      expect(doctorsService.create).toHaveBeenCalledWith(doctorData);
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: createdDoctor.id, email: createdDoctor.email, role: 'doctor' });
      expect(result).toEqual({
        access_token: token,
        user: { id: createdDoctor.id, name: createdDoctor.name, email: createdDoctor.email, specialization: createdDoctor.specialization, role: 'doctor' },
      });
    });

    it('should throw error if doctor already exists', async () => {
      const doctorData = { name: 'Dr. Smith', email: 'smith@example.com', password: 'password', specialization: 'Cardiology' };
      doctorsService.findByEmail.mockResolvedValue({ id: 1 } as any);

      await expect(service.registerDoctor(doctorData)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const email = 'john@example.com';
      const password = 'password';
      const hashedPassword = '$2b$10$hashedpassword';
      const user = { id: 1, name: 'John', email, password: hashedPassword };
      const token = 'jwt-token';

      usersService.findByEmail.mockResolvedValue(user);
      jwtService.sign.mockReturnValue(token);

      // Mock bcrypt.compare
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true);

      const result = await service.login(email, password, 'user');

      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(require('bcrypt').compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: user.id, email: user.email, role: 'user' });
      expect(result).toEqual({
        access_token: token,
        user: { id: user.id, name: user.name, email: user.email, role: 'user' },
      });
    });

    it('should throw error for invalid credentials - user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login('invalid@example.com', 'password', 'user')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw error for invalid password', async () => {
      const user = { id: 1, password: 'hashed' };
      usersService.findByEmail.mockResolvedValue(user);
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(false);

      await expect(service.login('john@example.com', 'wrongpassword', 'user')).rejects.toThrow(UnauthorizedException);
    });

    it('should login doctor successfully', async () => {
      const email = 'smith@example.com';
      const password = 'password';
      const doctor = { id: 1, name: 'Dr. Smith', email, password: 'hashed', specialization: 'Cardiology' };
      const token = 'jwt-token';

      doctorsService.findByEmail.mockResolvedValue(doctor);
      jwtService.sign.mockReturnValue(token);
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true);

      const result = await service.login(email, password, 'doctor');

      expect(result).toEqual({
        access_token: token,
        user: { id: doctor.id, name: doctor.name, email: doctor.email, specialization: doctor.specialization, role: 'doctor' },
      });
    });
  });
});

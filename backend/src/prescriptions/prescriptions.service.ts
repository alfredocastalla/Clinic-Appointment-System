import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription } from './entities/prescription.entity';
import { AuthenticatedUser } from '../auth/types';

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectRepository(Prescription)
    private prescriptionsRepo: Repository<Prescription>,
  ) {}

  async create(data: any, user: AuthenticatedUser) {
    if (user.role !== 'doctor') {
      throw new UnauthorizedException('Only doctors can create prescriptions');
    }

    const prescription = this.prescriptionsRepo.create({
      ...data,
      doctorId: user.id,
      doctorName: user.name,
      date: data.date || new Date().toISOString().split('T')[0],
    });

    return this.prescriptionsRepo.save(prescription);
  }

  findAll(user: AuthenticatedUser) {
    if (!user) {
      return this.prescriptionsRepo.find();
    }

    if (user.role === 'doctor') {
      return this.prescriptionsRepo.find({ where: { doctorId: user.id } });
    }

    if (user.role === 'user') {
      return this.prescriptionsRepo.find({ where: { patientId: user.id } });
    }

    return this.prescriptionsRepo.find();
  }
}

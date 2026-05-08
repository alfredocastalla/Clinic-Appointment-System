import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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

  async requestRefill(prescriptionId: number, note: string | undefined, user: AuthenticatedUser) {
    if (user.role !== 'user') {
      throw new UnauthorizedException('Only patients can request prescription refills');
    }

    const prescription = await this.prescriptionsRepo.findOne({ where: { id: prescriptionId } });
    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    if (prescription.patientId !== user.id) {
      throw new UnauthorizedException('You can only request refills for your own prescriptions');
    }

    prescription.refillRequested = true;
    prescription.refillRequestNote = note ?? undefined;
    prescription.refillRequestedAt = new Date();
    prescription.refillStatus = 'pending';

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

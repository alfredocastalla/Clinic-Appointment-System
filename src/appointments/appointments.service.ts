import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private repo: Repository<Appointment>,
  ) {}

  create(data: any) {
    return this.repo.save({ ...data, status: 'pending' });
  }

  findAll(user?: any) {
    if (!user) {
      return this.repo.find();
    }

    if (user.role === 'user') {
      return this.repo.find({ where: { patientId: user.id } });
    }

    if (user.role === 'doctor') {
      return this.repo.find({ where: { doctorId: user.id } });
    }

    return this.repo.find();
  }

  async findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async confirm(id: number, user: any) {
    const appointment = await this.findOne(id);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (user.role !== 'doctor' || appointment.doctorId !== user.id) {
      throw new UnauthorizedException('Only the assigned doctor can confirm this appointment');
    }

    await this.repo.update(id, { status: 'confirmed' });
    return this.findOne(id);
  }

  async cancel(id: number, user: any) {
    const appointment = await this.findOne(id);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (user.role === 'user' && appointment.patientId !== user.id) {
      throw new UnauthorizedException('Not authorized to cancel this appointment');
    }

    if (user.role === 'doctor' && appointment.doctorId !== user.id) {
      throw new UnauthorizedException('Not authorized to cancel this appointment');
    }

    await this.repo.update(id, { status: 'cancelled' });
    return this.findOne(id);
  }
}

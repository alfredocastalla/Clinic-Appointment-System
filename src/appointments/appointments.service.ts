import { Injectable } from '@nestjs/common';
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
    return this.repo.save({ ...data, status: 'booked' });
  }

  findAll() {
    return this.repo.find();
  }

  confirm(id: number) {
    return this.repo.update(id, { status: 'confirmed' });
  }

  cancel(id: number) {
    return this.repo.update(id, { status: 'cancelled' });
  }
}

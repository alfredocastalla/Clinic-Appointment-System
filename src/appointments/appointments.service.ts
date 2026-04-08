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
    return this.repo.save({ ...data, status: 'pending' });
  }

  findAll() {
    return this.repo.find();
  }

  async findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async confirm(id: number) {
    await this.repo.update(id, { status: 'confirmed' });
    return this.findOne(id);
  }

  async cancel(id: number) {
    await this.repo.update(id, { status: 'cancelled' });
    return this.findOne(id);
  }
}

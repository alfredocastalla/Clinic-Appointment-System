import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Doctor } from './entities/doctor.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private repo: Repository<Doctor>,
  ) {}

  async create(data: { name: string; email: string; password: string; specialization: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const doctor = this.repo.create({ ...data, password: hashedPassword });
    return this.repo.save(doctor);
  }

  async findAll() {
    return this.repo.find();
  }

  async findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  async update(id: number, updateDoctorDto: any) {
    await this.repo.update(id, updateDoctorDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}

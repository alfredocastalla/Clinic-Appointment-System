import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
  ) {}

  async create(data: { name: string; email: string; password: string; role: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = this.repo.create({ ...data, password: hashedPassword });
    return this.repo.save(user);
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

  async update(id: number, updateUserDto: any) {
    await this.repo.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}

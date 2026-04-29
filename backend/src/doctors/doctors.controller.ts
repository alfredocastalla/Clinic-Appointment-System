import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { DoctorsService } from './doctors.service';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  private sanitizeDoctor<T extends { password?: string } | null>(doctor: T) {
    if (!doctor) {
      return doctor;
    }

    const { password, ...safeDoctor } = doctor;
    return safeDoctor;
  }

  @Post()
  async create(@Body() createDoctorDto: { name: string; email: string; password: string; specialization: string; availableTime?: string; address?: string; phone?: string; photo?: string }) {
    const doctor = await this.doctorsService.create(createDoctorDto);
    return this.sanitizeDoctor(doctor);
  }

  @Get()
  async findAll() {
    const doctors = await this.doctorsService.findAll();
    return doctors.map((doctor) => this.sanitizeDoctor(doctor));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const doctor = await this.doctorsService.findOne(+id);
    return this.sanitizeDoctor(doctor);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDoctorDto: any) {
    const doctor = await this.doctorsService.update(+id, updateDoctorDto);
    return this.sanitizeDoctor(doctor);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.doctorsService.remove(+id);
  }
}

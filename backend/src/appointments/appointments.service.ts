import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Doctor } from '../doctors/entities/doctor.entity';
import { User } from '../users/entities/user.entity';
import { AuthenticatedUser } from '../auth/types';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private repo: Repository<Appointment>,
    @InjectRepository(Doctor)
    private doctorsRepo: Repository<Doctor>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async create(data: any) {
    const appointment = await this.prepareAppointmentData(data);
    return this.repo.save({ ...appointment, status: 'pending' });
  }

  findAll(user?: AuthenticatedUser) {
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

  async confirm(id: number, user: AuthenticatedUser) {
    const appointment = await this.findOne(id);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (user.role !== 'doctor' || appointment.doctorId !== user.id) {
      throw new UnauthorizedException(
        'Only the assigned doctor can confirm this appointment',
      );
    }

    if (appointment.status !== 'pending') {
      throw new BadRequestException(
        'Only pending appointments can be confirmed',
      );
    }

    await this.repo.update(id, { status: 'confirmed' });
    return this.findOne(id);
  }

  async complete(id: number, user: AuthenticatedUser) {
    const appointment = await this.findOne(id);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (user.role !== 'doctor' || appointment.doctorId !== user.id) {
      throw new UnauthorizedException(
        'Only the assigned doctor can complete this appointment',
      );
    }

    if (appointment.status !== 'confirmed') {
      throw new BadRequestException(
        'Only confirmed appointments can be completed',
      );
    }

    await this.repo.update(id, { status: 'completed' });
    return this.findOne(id);
  }

  async update(id: number, data: any, user: AuthenticatedUser) {
    const appointment = await this.findOne(id);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (user.role !== 'user' || appointment.patientId !== user.id) {
      throw new UnauthorizedException(
        'Only the appointment owner can update this appointment',
      );
    }

    if (appointment.status !== 'pending') {
      throw new BadRequestException(
        'Only pending appointments can be rescheduled',
      );
    }

    const updatedFields: any = {};
    if (data.date) {
      updatedFields.date = data.date;
    }
    if (data.time !== undefined) {
      updatedFields.time = data.time;
    }
    if (data.symptoms !== undefined) {
      updatedFields.symptoms = data.symptoms;
    }

    if (Object.keys(updatedFields).length === 0) {
      return this.findOne(id);
    }

    await this.prepareAppointmentData({ ...appointment, ...updatedFields }, id);
    await this.repo.update(id, updatedFields);
    return this.findOne(id);
  }

  async cancel(id: number, user: AuthenticatedUser) {
    const appointment = await this.findOne(id);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (user.role === 'user' && appointment.patientId !== user.id) {
      throw new UnauthorizedException(
        'Not authorized to cancel this appointment',
      );
    }

    if (user.role === 'doctor' && appointment.doctorId !== user.id) {
      throw new UnauthorizedException(
        'Not authorized to cancel this appointment',
      );
    }

    if (appointment.status === 'completed') {
      throw new BadRequestException(
        'Completed appointments cannot be cancelled',
      );
    }

    await this.repo.update(id, { status: 'cancelled' });
    return this.findOne(id);
  }

  private async prepareAppointmentData(data: any, appointmentId?: number) {
    const doctorId = Number(data.doctorId);
    const date = typeof data.date === 'string' ? data.date.trim() : '';
    const time = typeof data.time === 'string' ? data.time.trim() : data.time;

    if (!Number.isInteger(doctorId) || doctorId <= 0) {
      throw new BadRequestException('A valid doctor is required');
    }

    if (!date) {
      throw new BadRequestException('Appointment date is required');
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException(
        'Appointment date must use YYYY-MM-DD format',
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appointmentDate = new Date(`${date}T00:00:00`);
    if (Number.isNaN(appointmentDate.getTime()) || appointmentDate < today) {
      throw new BadRequestException('Appointment date cannot be in the past');
    }

    if (time && !/^\d{2}:\d{2}$/.test(time)) {
      throw new BadRequestException('Appointment time must use HH:mm format');
    }

    const doctor = await this.doctorsRepo.findOne({ where: { id: doctorId } });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    if (time) {
      const existing = await this.repo.findOne({
        where: { doctorId, date, time },
      });

      if (
        existing &&
        existing.id !== appointmentId &&
        existing.status !== 'cancelled' &&
        existing.status !== 'completed'
      ) {
        throw new BadRequestException(
          'This doctor already has an appointment at that time',
        );
      }
    }

    return {
      ...data,
      doctorId,
      date,
      time: time || null,
      symptoms:
        typeof data.symptoms === 'string'
          ? data.symptoms.trim()
          : data.symptoms,
    };
  }
}

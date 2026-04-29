import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';
import { Doctor } from '../doctors/entities/doctor.entity';

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqljs',
          autoSave: false,
          entities: [Appointment, Doctor],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Appointment, Doctor]),
      ],
      providers: [AppointmentsService],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects appointments for missing doctors', async () => {
    await expect(
      service.create({
        doctorId: 999,
        patientId: 1,
        patientName: 'Patient One',
        date: '2099-01-01',
        time: '09:00',
      }),
    ).rejects.toThrow('Doctor not found');
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Appointment],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Appointment]),
      ],
      providers: [AppointmentsService],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

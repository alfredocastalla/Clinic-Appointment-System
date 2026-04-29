import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Appointments (E2E)', () => {
  let app: INestApplication;
  let userToken: string;
  let doctorToken: string;
  let userId: number;
  let doctorId: number;
  let appointmentId: number;
  const suffix = Date.now();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Register and login user
    const userResponse = await request(app.getHttpServer())
      .post('/auth/register/user')
      .send({
        name: 'E2E Test User',
        email: `e2euser-${suffix}@example.com`,
        password: 'password123',
      });

    userToken = userResponse.body.access_token;
    userId = userResponse.body.user.id;

    // Register and login doctor
    const doctorResponse = await request(app.getHttpServer())
      .post('/auth/register/doctor')
      .send({
        name: 'E2E Test Doctor',
        email: `e2edoctor-${suffix}@example.com`,
        password: 'password123',
        specialization: 'General Medicine',
        availableTime: '9:00 AM - 5:00 PM',
      });

    doctorToken = doctorResponse.body.access_token;
    doctorId = doctorResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Appointment Flow', () => {
    it('should allow user to book an appointment', () => {
      return request(app.getHttpServer())
        .post('/appointments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          doctorId: doctorId,
          date: '2026-04-15',
          patientName: 'E2E Test User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.status).toBe('pending');
          expect(res.body.doctorId).toBe(doctorId);
          appointmentId = res.body.id;
        });
    });

    it('should allow user to view their appointments', () => {
      return request(app.getHttpServer())
        .get('/appointments')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          const appointment = res.body.find((a) => a.id === appointmentId);
          expect(appointment).toBeDefined();
          expect(appointment.patientName).toBe('E2E Test User');
        });
    });

    it('should allow doctor to view their appointments', () => {
      return request(app.getHttpServer())
        .get('/appointments')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          const appointment = res.body.find((a) => a.id === appointmentId);
          expect(appointment).toBeDefined();
          expect(appointment.doctorId).toBe(doctorId);
        });
    });

    it('should allow doctor to confirm the appointment', () => {
      return request(app.getHttpServer())
        .patch(`/appointments/${appointmentId}/confirm`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('confirmed');
        });
    });

    it('should allow user to cancel the appointment', () => {
      return request(app.getHttpServer())
        .patch(`/appointments/${appointmentId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('cancelled');
        });
    });
  });

  describe('Doctors API', () => {
    it('should return list of doctors', () => {
      return request(app.getHttpServer())
        .get('/doctors')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          const doctor = res.body.find((d) => d.id === doctorId);
          expect(doctor).toBeDefined();
          expect(doctor.specialization).toBe('General Medicine');
        });
    });
  });
});
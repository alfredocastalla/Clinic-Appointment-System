import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Auth (Integration)', () => {
  let app: INestApplication;
  const suffix = Date.now();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register/user (POST)', () => {
    it('should register a new user', () => {
      const email = `testuser-${suffix}@example.com`;
      return request(app.getHttpServer())
        .post('/auth/register/user')
        .send({
          name: 'Test User',
          email,
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user.email).toBe(email);
          expect(res.body.user.role).toBe('user');
        });
    });

    it('should return error for duplicate email', async () => {
      const duplicateEmail = `duplicate-${suffix}@example.com`;
      // First register
      await request(app.getHttpServer())
        .post('/auth/register/user')
        .send({
          name: 'Test User',
          email: duplicateEmail,
          password: 'password123',
        });

      // Try to register again
      return request(app.getHttpServer())
        .post('/auth/register/user')
        .send({
          name: 'Test User 2',
          email: duplicateEmail,
          password: 'password456',
        })
        .expect(401);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeAll(async () => {
      // Register a user for login test
      await request(app.getHttpServer())
        .post('/auth/register/user')
        .send({
          name: 'Login Test User',
          email: `logintest-${suffix}@example.com`,
          password: 'password123',
        });
    });

    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'password123',
          role: 'user',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body.user.email).toBe('logintest@example.com');
        });
    });

    it('should return error for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'wrongpassword',
          role: 'user',
        })
        .expect(401);
    });
  });
});
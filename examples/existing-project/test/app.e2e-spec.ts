import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { User } from '../src/domain/users/user.entity';

interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  accessToken: string;
}

describe('Authentication & Users API (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same validation pipe as in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.setGlobalPrefix('api/v1');

    userRepository = moduleFixture.get(getRepositoryToken(User));

    await app.init();
  });

  afterAll(async () => {
    await userRepository.clear();
    await app.close();
  });

  beforeEach(async () => {
    await userRepository.clear();
  });

  describe('Health Check', () => {
    it('/ (GET) should return Hello World', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });

  describe('Authentication', () => {
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    it('/api/v1/users (POST) should create a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send(testUser)
        .expect(201);

      const createdUser = response.body as User;
      expect(createdUser).toHaveProperty('id');
      expect(createdUser.email).toBe(testUser.email);
      expect(createdUser.name).toBe(testUser.name);
      expect(createdUser).not.toHaveProperty('password');
    });

    it('/api/v1/auth/login (POST) should authenticate user', async () => {
      // First create a user
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .send(testUser)
        .expect(201);

      // Then authenticate
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      const authResponse = response.body as AuthResponse;
      expect(authResponse).toHaveProperty('accessToken');
      expect(authResponse).toHaveProperty('user');
      expect(authResponse.user.email).toBe(testUser.email);

      accessToken = authResponse.accessToken;
    });

    it('/api/v1/auth/login (POST) should return 401 for invalid credentials', async () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('Users CRUD', () => {
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    beforeEach(async () => {
      // Create and authenticate user for protected routes
      await request(app.getHttpServer()).post('/api/v1/users').send(testUser);

      const authResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      accessToken = (authResponse.body as AuthResponse).accessToken;
    });

    it('/api/v1/users (GET) should return users list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const usersResponse = response.body as { users: User[]; pagination: any };
      expect(usersResponse).toHaveProperty('users');
      expect(usersResponse).toHaveProperty('pagination');
      expect(Array.isArray(usersResponse.users)).toBe(true);
    });

    it('/api/v1/users/:id (GET) should return specific user', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          name: 'Another User',
          email: 'another@example.com',
          password: 'password123',
        });

      const userId = (createResponse.body as User).id;

      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const userResponse = response.body as User;
      expect(userResponse.id).toBe(userId);
      expect(userResponse.email).toBe('another@example.com');
    });

    it('/api/v1/users/:id (PATCH) should update user', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          name: 'Update User',
          email: 'update@example.com',
          password: 'password123',
        });

      const userId = (createResponse.body as User).id;

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      const updatedUser = response.body as User;
      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.email).toBe('update@example.com');
    });

    it('should require authentication for protected routes', async () => {
      await request(app.getHttpServer()).get('/api/v1/users').expect(401);
    });
  });
});

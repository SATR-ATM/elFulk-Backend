import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Module } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { Request, Response, NextFunction } from 'express';
import { AuthController } from '../src/modules/auth/auth.controller';
import { ParentService } from '../src/modules/parent/parent.service';

function mockSessionMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  (req as unknown as Record<string, unknown>).session = {
    user: {
      id: 'user-uuid',
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      first_name: 'Test',
      last_name: 'User',
      phone_number: null,
      lock_alerts: false,
      limit_warning: false,
      is_active: true,
    },
  };
  next();
}

const mockParentService = {
  findByUserId: jest.fn(),
  activatePin: jest.fn(),
};

@Module({
  controllers: [AuthController],
  providers: [{ provide: ParentService, useValue: mockParentService }],
})
class TestAuthModule {}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAuthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(mockSessionMiddleware);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return the session user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(200);

      expect(response.body).toMatchObject({
        id: 'user-uuid',
        email: 'test@example.com',
      });
    });
  });

  describe('POST /api/v1/auth/activate-pin', () => {
    it('should return 400 when pin is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/activate-pin')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for non-numeric pin', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/activate-pin')
        .send({ pin: 'abcd' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });
});

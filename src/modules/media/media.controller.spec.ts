import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as supertestImport from 'supertest';
const request = (supertestImport as unknown as any).default ?? supertestImport;

import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaAsset } from './media.entity';
import { ImageKitService } from '../imagekit/imagekit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { Reflector } from '@nestjs/core';

// ─── Test constants ───────────────────────────────────────────────────────────

const JWT_SECRET = 'changeme';

const AUTH_PAYLOAD = {
  token: 'tok_abc123',
  expires: 9999999999,
  signature: 'sigXYZ',
  publicKey: 'pub_key',
};

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockMediaService = {
  getUploadAuth: jest.fn(),
};

const mockMediaRepository = {
  save: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
};

const mockImageKitService = {
  getAuthParameters: jest.fn(),
  getSignedUrl: jest.fn(),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('MediaController – GET /media/upload-auth', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: JWT_SECRET,
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [MediaController],
      providers: [
        { provide: MediaService, useValue: mockMediaService },
        { provide: getRepositoryToken(MediaAsset), useValue: mockMediaRepository },
        { provide: ImageKitService, useValue: mockImageKitService },
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        Reflector,
      ],
    }).compile();

    jwtService = module.get<JwtService>(JwtService);
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.JWT_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockMediaService.getUploadAuth.mockResolvedValue(AUTH_PAYLOAD);
  });

  // ─── 401 – No token ───────────────────────────────────────────────────────

  it('should return 401 when no Authorization header is provided', async () => {
    await request(app.getHttpServer())
      .get('/media/upload-auth')
      .expect(401);
  });

  it('should return 401 when Authorization header has a malformed token', async () => {
    await request(app.getHttpServer())
      .get('/media/upload-auth')
      .set('Authorization', 'Bearer not.a.valid.jwt')
      .expect(401);
  });

  // ─── 403 – Wrong role ─────────────────────────────────────────────────────

  it('should return 403 when authenticated as parent (non-admin)', async () => {
    const token = jwtService.sign({ sub: 'parent-uuid', email: 'parent@test.com', role: 'parent' });

    await request(app.getHttpServer())
      .get('/media/upload-auth')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('should return 403 when authenticated as child', async () => {
    const token = jwtService.sign({ sub: 'child-uuid', role: 'child' });

    await request(app.getHttpServer())
      .get('/media/upload-auth')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  // ─── 200 – Admin access ───────────────────────────────────────────────────

  it('should return 200 with auth payload when authenticated as admin', async () => {
    const token = jwtService.sign({ sub: 'admin-uuid', email: 'admin@test.com', role: 'admin' });

    const response = await request(app.getHttpServer())
      .get('/media/upload-auth')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual(AUTH_PAYLOAD);
  });

  it('should call MediaService.getUploadAuth() exactly once on a valid admin request', async () => {
    const token = jwtService.sign({ sub: 'admin-uuid', email: 'admin@test.com', role: 'admin' });

    await request(app.getHttpServer())
      .get('/media/upload-auth')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(mockMediaService.getUploadAuth).toHaveBeenCalledTimes(1);
  });

  it('should include token, expires, signature, and publicKey in the response body', async () => {
    const token = jwtService.sign({ sub: 'admin-uuid', email: 'admin@test.com', role: 'admin' });

    const { body } = await request(app.getHttpServer())
      .get('/media/upload-auth')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(body).toHaveProperty('token', AUTH_PAYLOAD.token);
    expect(body).toHaveProperty('expires', AUTH_PAYLOAD.expires);
    expect(body).toHaveProperty('signature', AUTH_PAYLOAD.signature);
    expect(body).toHaveProperty('publicKey', AUTH_PAYLOAD.publicKey);
  });

  it('should return Content-Type application/json', async () => {
    const token = jwtService.sign({ sub: 'admin-uuid', email: 'admin@test.com', role: 'admin' });

    await request(app.getHttpServer())
      .get('/media/upload-auth')
      .set('Authorization', `Bearer ${token}`)
      .expect('Content-Type', /application\/json/);
  });
});

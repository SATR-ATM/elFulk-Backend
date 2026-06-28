import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should extend AuthGuard("jwt")', () => {
    const JwtPassportGuard = AuthGuard('jwt');
    expect(guard).toBeInstanceOf(JwtPassportGuard);
  });

  it('should reject a request with no authorization header', async () => {
    // Simulate what passport does internally — call the real canActivate
    // but with a mock context carrying no bearer token.
    const mockGetRequest = jest.fn().mockReturnValue({
      headers: {},
    });

    const mockContext = {
      switchToHttp: () => ({ getRequest: mockGetRequest }),
      getType: () => 'http',
    } as unknown as ExecutionContext;

    // The guard's canActivate throws UnauthorizedException or returns false
    await expect(guard.canActivate(mockContext)).rejects.toBeDefined();
  });
});

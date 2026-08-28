import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  // ─── No required roles ────────────────────────────────────────────────────

  describe('when no roles are required', () => {
    it('should allow access for any user', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

      const ctx = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: '1', role: 'child' } }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should allow access even if there is no user', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

      const ctx = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ user: null }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  // ─── Role required, single role field ────────────────────────────────────

  describe('when roles are required', () => {
    it('should allow access when user.role matches', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);

      const ctx = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: '1', role: 'admin' } }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should deny access when user.role does not match', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);

      const ctx = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: '1', role: 'parent' } }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('should deny access when user is null', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);

      const ctx = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ user: null }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('should deny access when user has no role', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);

      const ctx = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: '1' } }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('should allow access when user.roles array contains required role', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);

      const ctx = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: '1', roles: ['admin', 'parent'] } }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should deny access when user.roles array does not include required role', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);

      const ctx = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: '1', roles: ['child', 'parent'] } }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('should allow access when one of multiple required roles matches', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin', 'parent']);

      const ctx = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: '1', role: 'parent' } }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should allow a "child" role when that role is required', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['child']);

      const ctx = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: '1', role: 'child' } }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Repository, ObjectLiteral } from 'typeorm';
import { AdminService } from './admin.service';
import { Admin, AdminRole, AccountStatus } from './admin.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminRoleStatusDto } from './dto/update-admin-role-status.dto';
import * as adminServiceModule from './admin.service';

type MockRepository<T extends ObjectLiteral = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;
describe('AdminService', () => {
  let service: AdminService;
  let adminRepository: MockRepository<Admin>;
  let logger: { log: jest.Mock; warn: jest.Mock };

  beforeEach(async () => {
    adminRepository = {
      exists: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      remove: jest.fn(),
      preload: jest.fn(),
    };

    logger = { log: jest.fn(), warn: jest.fn() };
    jest
      .spyOn(adminServiceModule, 'hashPassword')
      .mockResolvedValue('hashedPassword');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(Admin), useValue: adminRepository },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);

    Object.defineProperty(service, 'logger', {
      value: logger,
      writable: true,
    });

    process.env.SUPER_ADMIN_EMAIL = '';
    process.env.SUPER_ADMIN_PASSWORD = '';
    process.env.SUPER_ADMIN_FIRST_NAME = '';
    process.env.SUPER_ADMIN_LAST_NAME = '';
  });

  afterEach(() => jest.clearAllMocks());

  describe('ensureSuperAdminExists', () => {
    it('does nothing if super admin exists', async () => {
      adminRepository.exists?.mockResolvedValue(true);
      await service.ensureSuperAdminExists();
      expect(adminRepository.exists).toHaveBeenCalled();
      expect(adminRepository.save).not.toHaveBeenCalled();
    });

    it('warns if env variables are missing', async () => {
      adminRepository.exists?.mockResolvedValue(false);
      await service.ensureSuperAdminExists();
      expect(logger.warn).toHaveBeenCalled();
      expect(adminRepository.save).not.toHaveBeenCalled();
    });

    it('creates and saves super admin', async () => {
      adminRepository.exists?.mockResolvedValue(false);
      process.env.SUPER_ADMIN_EMAIL = 'admin@test.com';
      process.env.SUPER_ADMIN_PASSWORD = '123456';
      process.env.SUPER_ADMIN_FIRST_NAME = 'John';
      process.env.SUPER_ADMIN_LAST_NAME = 'Doe';
      adminRepository.create?.mockReturnValue({ id: 1 });
      adminRepository.save?.mockResolvedValue({});

      await service.ensureSuperAdminExists();

      expect(adminServiceModule.hashPassword).toHaveBeenCalledWith('123456');
      expect(adminRepository.create).toHaveBeenCalled();
      expect(adminRepository.save).toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalled();
    });

    it('warns if duplicate email occurs', async () => {
      adminRepository.exists?.mockResolvedValue(false);
      process.env.SUPER_ADMIN_EMAIL = 'admin@test.com';
      process.env.SUPER_ADMIN_PASSWORD = '123456';
      process.env.SUPER_ADMIN_FIRST_NAME = 'John';
      process.env.SUPER_ADMIN_LAST_NAME = 'Doe';
      adminRepository.create?.mockReturnValue({});
      adminRepository.save?.mockRejectedValue({ code: '23505' });

      await service.ensureSuperAdminExists();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('throws unknown errors', async () => {
      adminRepository.exists?.mockResolvedValue(false);
      process.env.SUPER_ADMIN_EMAIL = 'admin@test.com';
      process.env.SUPER_ADMIN_PASSWORD = '123456';
      process.env.SUPER_ADMIN_FIRST_NAME = 'John';
      process.env.SUPER_ADMIN_LAST_NAME = 'Doe';
      adminRepository.create?.mockReturnValue({});
      adminRepository.save?.mockRejectedValue(new Error('DB crash'));

      await expect(service.ensureSuperAdminExists()).rejects.toThrow(
        'DB crash',
      );
    });
  });

  describe('create', () => {
    it('creates a new admin', async () => {
      const dto: CreateAdminDto = {
        first_name: 'one',
        last_name: 'two',
        email: 'khaliltouil@gmail.com',
        password: '123456',
      };
      const mockCreatedAdmin = {
        ...dto,
        password_hash: 'hashedPassword',
        role: AdminRole.MODERATOR,
        status: AccountStatus.PENDING,
      };
      const mockSavedAdmin = {
        id: 1,
        ...mockCreatedAdmin,
      };

      adminRepository.create?.mockReturnValue(mockCreatedAdmin);
      adminRepository.save?.mockResolvedValue(mockSavedAdmin);

      const result = await service.create(dto);

      expect(adminServiceModule.hashPassword).toHaveBeenCalledWith('123456');
      expect(adminRepository.create).toHaveBeenCalledWith({
        first_name: dto.first_name,
        last_name: dto.last_name,
        email: dto.email.toLowerCase().trim(),
        password_hash: 'hashedPassword',
        role: AdminRole.MODERATOR,
        status: AccountStatus.PENDING,
      });
      expect(adminRepository.save).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });

    it('throws if password is missing', async () => {
      const dto = {
        first_name: 'one',
        last_name: 'two',
        email: 'a@test.com',
      } as CreateAdminDto;
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('throws if email exists', async () => {
      const dto: CreateAdminDto = {
        first_name: 'one',
        last_name: 'two',
        email: 'a@test.com',
        password: '123456',
      };
      adminRepository.create?.mockReturnValue({});
      adminRepository.save?.mockRejectedValue({ code: '23505' });
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns all admins', async () => {
      const fakeAdmins = [{ id: 1 }, { id: 2 }];
      adminRepository.find?.mockResolvedValue(fakeAdmins);
      const result = await service.findAll();
      expect(adminRepository.find).toHaveBeenCalledWith({
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(fakeAdmins);
    });
  });

  describe('findOne', () => {
    it('returns admin if found', async () => {
      const admin = { id: '1' };
      adminRepository.findOne?.mockResolvedValue(admin);
      const result = await service.findOne('1');
      expect(result).toEqual(admin);
    });

    it('throws if admin not found', async () => {
      adminRepository.findOne?.mockResolvedValue(null);
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('updates with password', async () => {
      const id = '2';
      const dto = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'a@test.com',
        password: '123456',
      };
      const preloadedAdmin = { id, ...dto, password_hash: 'hashedPassword' };
      adminRepository.preload?.mockResolvedValue(preloadedAdmin);
      adminRepository.save?.mockResolvedValue(preloadedAdmin);

      const result = await service.updateProfile(id, dto);
      expect(adminServiceModule.hashPassword).toHaveBeenCalledWith('123456');
      expect(result.id).toBe('2');
    });

    it('updates without password', async () => {
      const id = '2';
      const dto = { first_name: 'John', last_name: 'Doe', email: 'a@test.com' };
      const preloadedAdmin = { id, ...dto };
      adminRepository.preload?.mockResolvedValue(preloadedAdmin);
      adminRepository.save?.mockResolvedValue(preloadedAdmin);

      const result = await service.updateProfile(id, dto);
      expect(adminServiceModule.hashPassword).not.toHaveBeenCalled();
      expect(result.id).toBe('2');
    });

    it('throws if admin not found', async () => {
      adminRepository.preload?.mockResolvedValue(null);
      const dto = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'a@test.com',
        password: '123456',
      };
      await expect(service.updateProfile('2', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateRoleAndStatus', () => {
    it('throws if neither role nor status', async () => {
      const dto: UpdateAdminRoleStatusDto = { approverId: '2' };
      await expect(service.updateRoleAndStatus('1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws if admin updates self', async () => {
      const dto: UpdateAdminRoleStatusDto = {
        approverId: '1',
        role: AdminRole.MODERATOR,
      };
      await expect(service.updateRoleAndStatus('1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws if approver not found', async () => {
      adminRepository.findOne
        ?.mockResolvedValueOnce(null)
        .mockResolvedValueOnce({});
      const dto: UpdateAdminRoleStatusDto = {
        approverId: '1',
        role: AdminRole.MODERATOR,
      };
      await expect(service.updateRoleAndStatus('2', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws if approver not SUPER_ADMIN', async () => {
      const approver = { id: '1', role: AdminRole.MODERATOR };
      const target = { id: '2' };
      adminRepository.findOne
        ?.mockResolvedValueOnce(approver)
        .mockResolvedValueOnce(target);
      const dto: UpdateAdminRoleStatusDto = {
        approverId: '1',
        role: AdminRole.MODERATOR,
      };
      await expect(service.updateRoleAndStatus('2', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('updates only role', async () => {
      const approver = { id: '1', role: AdminRole.SUPER_ADMIN };
      const target = {
        id: '2',
        role: AdminRole.MODERATOR,
        status: AccountStatus.PENDING,
      };
      adminRepository.findOne
        ?.mockResolvedValueOnce(approver)
        .mockResolvedValueOnce(target);
      adminRepository.save?.mockResolvedValue({
        ...target,
        role: AdminRole.SUPER_ADMIN,
      });
      const dto: UpdateAdminRoleStatusDto = {
        approverId: '1',
        role: AdminRole.SUPER_ADMIN,
      };
      const result = await service.updateRoleAndStatus('2', dto);
      expect(result.role).toBe(AdminRole.SUPER_ADMIN);
    });

    it('updates only status', async () => {
      const approver = { id: '1', role: AdminRole.SUPER_ADMIN };
      const target = {
        id: '2',
        role: AdminRole.MODERATOR,
        status: AccountStatus.PENDING,
      };
      adminRepository.findOne
        ?.mockResolvedValueOnce(approver)
        .mockResolvedValueOnce(target);
      adminRepository.save?.mockResolvedValue({
        ...target,
        status: AccountStatus.SUSPENDED,
      });
      const dto: UpdateAdminRoleStatusDto = {
        approverId: '1',
        status: AccountStatus.SUSPENDED,
      };
      const result = await service.updateRoleAndStatus('2', dto);
      expect(result.status).toBe(AccountStatus.SUSPENDED);
    });

    it('sets approvedBy and approved_at if ACTIVE', async () => {
      const approver = { id: '1', role: AdminRole.SUPER_ADMIN };
      const target = { id: '2', status: AccountStatus.PENDING };
      adminRepository.findOne
        ?.mockResolvedValueOnce(approver)
        .mockResolvedValueOnce(target);
      adminRepository.save?.mockImplementation((admin: Admin) =>
        Promise.resolve(admin),
      );
      const dto: UpdateAdminRoleStatusDto = {
        approverId: '1',
        status: AccountStatus.ACTIVE,
      };
      const result = await service.updateRoleAndStatus('2', dto);
      expect(result.approvedBy).toEqual(approver);
      expect(result.approved_at).toBeInstanceOf(Date);
    });
  });

  describe('remove', () => {
    it('removes admin if found', async () => {
      const admin = { id: '1' };
      adminRepository.findOneBy?.mockResolvedValue(admin);
      adminRepository.remove?.mockResolvedValue(admin);
      const result = await service.remove('1');
      expect(result).toEqual(admin);
    });

    it('throws if admin not found', async () => {
      adminRepository.findOneBy?.mockResolvedValue(null);
      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });
  });
});

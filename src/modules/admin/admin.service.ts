import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import { Admin, AdminRole, AccountStatus } from './admin.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { UpdateAdminRoleStatusDto } from './dto/update-admin-role-status.dto';

const SALT_ROUNDS = 10;

const hashPassword = (password: string): Promise<string> =>
  hash(password, SALT_ROUNDS);

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async ensureSuperAdminExists(): Promise<void> {
    const superAdminExists = await this.adminRepository.exists({
      where: { role: AdminRole.SUPER_ADMIN },
    });

    if (superAdminExists) {
      return;
    }

    const email = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();
    const password = process.env.SUPER_ADMIN_PASSWORD;
    const firstName = process.env.SUPER_ADMIN_FIRST_NAME?.trim();
    const lastName = process.env.SUPER_ADMIN_LAST_NAME?.trim();

    if (!email || !password || !firstName || !lastName) {
      this.logger.warn(
        'No SUPER_ADMIN exists and seed env vars are missing. Set SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_FIRST_NAME, SUPER_ADMIN_LAST_NAME.',
      );
      return;
    }

    const passwordHash = await hashPassword(password);

    const superAdmin = this.adminRepository.create({
      email,
      first_name: firstName,
      last_name: lastName,
      password_hash: passwordHash,
      role: AdminRole.SUPER_ADMIN,
      status: AccountStatus.ACTIVE,
      approved_at: new Date(),
    });

    try {
      await this.adminRepository.save(superAdmin);
      this.logger.log(`Seeded initial SUPER_ADMIN account for ${email}`);
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === '23505'
      ) {
        this.logger.warn(
          `SUPER_ADMIN seed skipped because email ${email} already exists`,
        );
        return;
      }
      throw err;
    }
  }

  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    if (
      !createAdminDto.password ||
      typeof createAdminDto.password !== 'string'
    ) {
      throw new BadRequestException(
        'Password is required and must be a string',
      );
    }

    const hashedPassword = await hashPassword(createAdminDto.password);
    const admin = this.adminRepository.create({
      first_name: createAdminDto.first_name,
      last_name: createAdminDto.last_name,
      email: createAdminDto.email.toLowerCase().trim(),
      password_hash: hashedPassword,
      role: AdminRole.MODERATOR,
      status: AccountStatus.PENDING,
    });

    try {
      return await this.adminRepository.save(admin);
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === '23505'
      ) {
        throw new ConflictException('Email already exists');
      }
      throw err;
    }
  }

  async findAll(): Promise<Admin[]> {
    return this.adminRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Admin> {
    const admin = await this.adminRepository.findOne({ where: { id } });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  async updateProfile(
    id: string,
    updateAdminDto: UpdateAdminDto,
  ): Promise<Admin> {
    const updatePayload: Partial<Admin> = {
      first_name: updateAdminDto.first_name,
      last_name: updateAdminDto.last_name,
      email: updateAdminDto.email,
    };

    if (updateAdminDto.password) {
      updatePayload.password_hash = await hashPassword(updateAdminDto.password);
    }

    const admin = await this.adminRepository.preload({ id, ...updatePayload });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return this.adminRepository.save(admin);
  }

  async updateRoleAndStatus(
    targetAdminId: string,
    updateDto: UpdateAdminRoleStatusDto,
  ): Promise<Admin> {
    const { approverId, role, status } = updateDto;

    if (role === undefined && status === undefined) {
      throw new BadRequestException(
        'At least one of role or status must be provided',
      );
    }

    if (targetAdminId === approverId) {
      throw new BadRequestException(
        'Admins cannot change their own role/status',
      );
    }

    const [approver, targetAdmin] = await Promise.all([
      this.adminRepository.findOne({ where: { id: approverId } }),
      this.adminRepository.findOne({ where: { id: targetAdminId } }),
    ]);

    if (!approver) {
      throw new NotFoundException('Approver admin not found');
    }

    if (approver.role !== AdminRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can change role/status');
    }

    if (!targetAdmin) {
      throw new NotFoundException('Target admin not found');
    }

    if (role !== undefined) {
      targetAdmin.role = role;
    }

    if (status !== undefined) {
      targetAdmin.status = status;
      if (status === AccountStatus.ACTIVE) {
        targetAdmin.approvedBy = approver;
        targetAdmin.approved_at = new Date();
      }
    }

    return this.adminRepository.save(targetAdmin);
  }

  async remove(id: string): Promise<Admin> {
    const admin = await this.adminRepository.findOneBy({ id });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }
    return this.adminRepository.remove(admin);
  }

  async approveModerator(
    moderatorId: string,
    approverId: string,
  ): Promise<Admin> {
    if (moderatorId === approverId) {
      throw new BadRequestException('Admins cannot approve themselves');
    }

    const [approver, moderator] = await Promise.all([
      this.adminRepository.findOne({ where: { id: approverId } }),
      this.adminRepository.findOne({ where: { id: moderatorId } }),
    ]);

    if (!approver) {
      throw new NotFoundException('Approver admin not found');
    }

    if (approver.role !== AdminRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can approve moderators');
    }

    if (!moderator) {
      throw new NotFoundException('Moderator not found');
    }

    if (moderator.status !== AccountStatus.PENDING) {
      throw new BadRequestException('Only PENDING moderators can be approved');
    }

    moderator.approvedBy = approver;
    moderator.approved_at = new Date();
    moderator.status = AccountStatus.ACTIVE;

    return this.adminRepository.save(moderator);
  }
}

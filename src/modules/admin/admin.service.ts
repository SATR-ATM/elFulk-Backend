import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import { Admin, AdminRole, AccountStatus } from './admin.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

const SALT_ROUNDS = 10;

const hashPassword = (password: string): Promise<string> =>
  hash(password, SALT_ROUNDS);

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

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

  async update(id: string, updateAdminDto: UpdateAdminDto): Promise<Admin> {
    if (updateAdminDto.password) {
      updateAdminDto.password = await hashPassword(updateAdminDto.password);
    }

    const admin = await this.adminRepository.preload({ id, ...updateAdminDto });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return this.adminRepository.save(admin);
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

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Admin, AdminRole, AccountStatus } from './admin.entity';
import { CreateAdminDto } from './create-admin.dto';
import { UpdateAdminDto } from './update-admin.dto';

const SALT_ROUNDS = 10;

const hashPassword = async (password: string): Promise<string> => {
  const bcrypt = await import('bcrypt');
  return bcrypt.hash(password, SALT_ROUNDS) as Promise<string>;
};

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    const existingAdmin = await this.adminRepository.findOne({
      where: { email: createAdminDto.email },
    });

    if (existingAdmin) {
      throw new BadRequestException('Email already in use');
    }

    if (!createAdminDto.password_hash || typeof createAdminDto.password_hash !== 'string') {
      throw new BadRequestException('Password is required and must be a string');
    }

    const hashedPassword = await hashPassword(createAdminDto.password_hash);

    const admin = this.adminRepository.create({
      first_name: createAdminDto.first_name,
      last_name: createAdminDto.last_name,
      email: createAdminDto.email,
      password_hash: hashedPassword,
      role: createAdminDto.role ?? AdminRole.MODERATOR,
      status: createAdminDto.status ?? AccountStatus.PENDING,
    });

    if (createAdminDto.approvedById) {
      const approvingAdmin = await this.adminRepository.findOne({
        where: { id: createAdminDto.approvedById },
      });

      if (!approvingAdmin) {
        throw new NotFoundException('Approving admin not found');
      }

      admin.approvedBy = approvingAdmin;
      admin.approved_at = new Date();
    }

    return this.adminRepository.save(admin);
  }

  async findAll(): Promise<Admin[]> {
    return this.adminRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findone(id: string): Promise<Admin> {
    const admin = await this.adminRepository.findOne({ where: { id } });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  async update(id: string, updateAdminDto: UpdateAdminDto): Promise<Admin> {
    if (updateAdminDto.password_hash) {
      updateAdminDto.password_hash = await hashPassword(updateAdminDto.password_hash);
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
}
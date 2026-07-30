import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Parent } from './parent.entity';
import { Admin } from '../admin/admin.entity';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';

@Injectable()
export class ParentService {
  constructor(
    @InjectRepository(Parent)
    private readonly repo: Repository<Parent>,
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
  ) {}

  async findById(id: string): Promise<Parent> {
    const parent = await this.repo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!parent) {
      throw new NotFoundException(`Parent with id ${id} not found`);
    }
    return parent;
  }

  async findByUserId(userId: string): Promise<Parent> {
    const parent = await this.repo.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!parent) {
      throw new NotFoundException(`Parent with user id ${userId} not found`);
    }
    return parent;
  }

  async create(userId: string, dto: CreateParentDto): Promise<Parent> {
    const existingParent = await this.repo.findOne({ where: { userId } });
    if (existingParent) {
      throw new ConflictException('User cannot be registered as a parent');
    }

    const existingAdmin = await this.adminRepo.findOne({ where: { userId } });
    if (existingAdmin) {
      throw new ConflictException('User cannot be registered as a parent');
    }

    const parent = this.repo.create({
      userId,
      username: dto.username,
      pin_hash: dto.pin_hash,
      phone_number: dto.phone_number,
    });
    return await this.repo.save(parent);
  }

  async update(id: string, partial: UpdateParentDto): Promise<Parent> {
    const parent = await this.findById(id);
    Object.assign(parent, partial);
    return await this.repo.save(parent);
  }

  private hashPin(pin: string): string {
    return crypto.createHash('sha256').update(pin).digest('hex');
  }

  async activatePin(id: string, pin: string): Promise<{ message: string }> {
    const parent = await this.repo
      .createQueryBuilder('parent')
      .addSelect('parent.pin_hash')
      .where('parent.id = :id', { id })
      .getOne();

    if (!parent) {
      throw new NotFoundException(`Parent with id ${id} not found`);
    }

    if (parent.pin_activated) {
      throw new BadRequestException('Parent mode is already activated');
    }

    parent.pin_hash = this.hashPin(pin);
    parent.pin_activated = true;
    await this.repo.save(parent);

    return { message: 'Parent mode activated successfully' };
  }

  async verifyPin(id: string, pin: string): Promise<boolean> {
    const parent = await this.repo
      .createQueryBuilder('parent')
      .addSelect('parent.pin_hash')
      .where('parent.id = :id', { id })
      .getOne();

    if (!parent) {
      throw new NotFoundException(`Parent with id ${id} not found`);
    }

    if (!parent.pin_activated || !parent.pin_hash) {
      throw new BadRequestException(
        'Parent mode is not activated. Please set a PIN first.',
      );
    }

    const matches = parent.pin_hash === this.hashPin(pin);
    if (!matches) {
      throw new UnauthorizedException('Invalid PIN');
    }

    return true;
  }
}

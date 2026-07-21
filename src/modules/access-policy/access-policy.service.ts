import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessPolicy } from './access-policy.entity';
import { CreateAccessPolicyDto } from './dto/create-access-policy.dto';
import { UpdateAccessPolicyDto } from './dto/update-access-policy.dto';

@Injectable()
export class AccessPolicyService {
  constructor(
    @InjectRepository(AccessPolicy)
    private readonly repo: Repository<AccessPolicy>,
  ) {}

  async create(dto: CreateAccessPolicyDto): Promise<AccessPolicy> {
    const accessPolicy = this.repo.create(dto);
    return await this.repo.save(accessPolicy);
  }

  async findAll(): Promise<AccessPolicy[]> {
    return await this.repo.find();
  }

  async findOne(id: string): Promise<AccessPolicy> {
    const accessPolicy = await this.repo.findOne({ where: { id } });
    if (!accessPolicy) {
      throw new NotFoundException(`AccessPolicy with id ${id} not found`);
    }
    return accessPolicy;
  }

  async update(id: string, dto: UpdateAccessPolicyDto): Promise<AccessPolicy> {
    const accessPolicy = await this.findOne(id);
    Object.assign(accessPolicy, dto);
    return await this.repo.save(accessPolicy);
  }

  async remove(id: string): Promise<void> {
    const accessPolicy = await this.findOne(id);
    await this.repo.remove(accessPolicy);
  }
}
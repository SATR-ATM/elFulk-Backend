import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Child } from './child.entity';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';

@Injectable()
export class ChildService {
  constructor(
    @InjectRepository(Child)
    private readonly childRepository: Repository<Child>,
  ) {}

  async create(dto: CreateChildDto): Promise<Child> {
    const child = this.childRepository.create(dto);
    return this.childRepository.save(child);
  }

  async findAll(): Promise<Child[]> {
    return this.childRepository.find();
  }

  async findOne(id: string): Promise<Child> {
    const child = await this.childRepository.findOne({ where: { id } });
    if (!child) {
      throw new NotFoundException(`Child with ID "${id}" not found`);
    }
    return child;
  }

  async update(id: string, dto: UpdateChildDto): Promise<Child> {
    const child = await this.findOne(id);
    Object.assign(child, dto);
    return this.childRepository.save(child);
  }

  async remove(id: string): Promise<void> {
    const child = await this.findOne(id);
    await this.childRepository.remove(child);
  }
}

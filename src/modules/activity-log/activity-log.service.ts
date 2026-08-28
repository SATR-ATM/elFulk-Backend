import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './activity-log.entity';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { UpdateActivityLogDto } from './dto/update-activity-log.dto';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
  ) {}

  async create(dto: CreateActivityLogDto): Promise<ActivityLog> {
    const log = this.activityLogRepository.create(dto);
    return this.activityLogRepository.save(log);
  }

  async findAll(): Promise<ActivityLog[]> {
    return this.activityLogRepository.find();
  }

  async findOne(id: string): Promise<ActivityLog> {
    const log = await this.activityLogRepository.findOne({ where: { id } });
    if (!log) {
      throw new NotFoundException(`ActivityLog with ID "${id}" not found`);
    }
    return log;
  }

  async update(id: string, dto: UpdateActivityLogDto): Promise<ActivityLog> {
    const log = await this.findOne(id);
    Object.assign(log, dto);
    return this.activityLogRepository.save(log);
  }

  async remove(id: string): Promise<void> {
    const log = await this.findOne(id);
    await this.activityLogRepository.remove(log);
  }
}

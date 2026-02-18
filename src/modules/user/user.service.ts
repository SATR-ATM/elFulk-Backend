import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './user.entity';
import { CreateUsersDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly repo: Repository<Users>,
  ) {}

  async create(dto: CreateUsersDto): Promise<Users> {
    const Users = this.repo.create(dto);
    return await this.repo.save(Users);
  }

  async findAll(): Promise<Users[]> {
    return await this.repo.find();
  }
}

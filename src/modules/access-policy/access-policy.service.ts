import { Injectable } from '@nestjs/common';
import { CreateAccessPolicyDto } from './dto/create-access-policy.dto';
import { UpdateAccessPolicyDto } from './dto/update-access-policy.dto';

@Injectable()
export class AccessPolicyService {
  create(createAccessPolicyDto: CreateAccessPolicyDto) {
    return 'This action adds a new accessPolicy';
  }

  findAll() {
    return `This action returns all accessPolicy`;
  }

  findOne(id: number) {
    return `This action returns a #${id} accessPolicy`;
  }

  update(id: number, updateAccessPolicyDto: UpdateAccessPolicyDto) {
    return `This action updates a #${id} accessPolicy`;
  }

  remove(id: number) {
    return `This action removes a #${id} accessPolicy`;
  }
}

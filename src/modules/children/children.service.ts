import { Injectable } from '@nestjs/common';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';

@Injectable()
export class ChildrenService {
  create(createChildDto: CreateChildDto) {
    return 'This action adds a new child';
  }

  findAll() {
    return `This action returns all children`;
  }

  findOne(id: number) {
    return `This action returns a #${id} child`;
  }

  update(id: number, updateChildDto: UpdateChildDto) {
    return `This action updates a #${id} child`;
  }

  remove(id: number) {
    return `This action removes a #${id} child`;
  }
}

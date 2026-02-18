import { Controller, Post, Body, Get } from '@nestjs/common';
import { UsersService } from './user.service';
import { CreateUsersDto } from './dto/create-user.dto';

@Controller('Users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Post()
  create(@Body() dto: CreateUsersDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}

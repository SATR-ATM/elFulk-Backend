import { Controller, Post, Body, Get } from '@nestjs/common';
import { UsersService } from './user.service';
import { CreateUsersDto } from './dto/create-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user account' })
  @ApiCreatedResponse({
    description: 'User account created successfully.',
    type: CreateUsersDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or email is already in use.',
  })
  @ApiBody({
    type: CreateUsersDto,
    description: 'Data for creating a new user',
  })
  create(@Body() dto: CreateUsersDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiOkResponse({
    description: 'List of all users',
    type: [CreateUsersDto],
  })
  findAll() {
    return this.service.findAll();
  }
}

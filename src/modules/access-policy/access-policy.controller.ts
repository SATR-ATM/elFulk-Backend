import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AccessPolicyService } from './access-policy.service';
import { CreateAccessPolicyDto } from './dto/create-access-policy.dto';
import { UpdateAccessPolicyDto } from './dto/update-access-policy.dto';

@ApiTags('access-policies')
@Controller('access-policies')
export class AccessPolicyController {
  constructor(private service: AccessPolicyService) {}

  @Post()
  @ApiOperation({ summary: 'Create access policy' })
  @ApiResponse({ status: 201, description: 'Access policy created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateAccessPolicyDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all access policies' })
  @ApiResponse({ status: 200, description: 'List of access policies' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get access policy by ID' })
  @ApiResponse({ status: 200, description: 'Access policy found' })
  @ApiResponse({ status: 404, description: 'Access policy not found' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update access policy' })
  @ApiResponse({ status: 200, description: 'Access policy updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Access policy not found' })
  update(@Param('id') id: string, @Body() dto: UpdateAccessPolicyDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete access policy' })
  @ApiResponse({ status: 200, description: 'Access policy deleted successfully' })
  @ApiResponse({ status: 404, description: 'Access policy not found' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ChildService } from './child.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';
import { Child } from './child.entity';

@ApiTags('children')
@Controller('children')
export class ChildController {
  constructor(private readonly childService: ChildService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new child profile' })
  @ApiResponse({
    status: 201,
    description: 'Child created successfully',
    type: Child,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateChildDto): Promise<Child> {
    return this.childService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all child profiles' })
  @ApiResponse({
    status: 200,
    description: 'List of all children',
    type: [Child],
  })
  findAll(): Promise<Child[]> {
    return this.childService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a child profile by ID' })
  @ApiParam({ name: 'id', description: 'Child UUIDv7' })
  @ApiResponse({ status: 200, description: 'Child found', type: Child })
  @ApiResponse({ status: 404, description: 'Child not found' })
  findOne(@Param('id') id: string): Promise<Child> {
    return this.childService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a child profile (partial)' })
  @ApiParam({ name: 'id', description: 'Child UUIDv7' })
  @ApiResponse({
    status: 200,
    description: 'Child updated successfully',
    type: Child,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Child not found' })
  update(@Param('id') id: string, @Body() dto: UpdateChildDto): Promise<Child> {
    return this.childService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a child profile' })
  @ApiParam({ name: 'id', description: 'Child UUIDv7' })
  @ApiResponse({ status: 204, description: 'Child deleted successfully' })
  @ApiResponse({ status: 404, description: 'Child not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.childService.remove(id);
  }
}

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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { auth } from '../../auth';
import { ChildService } from './child.service';
import { ParentService } from '../parent/parent.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';
import { Child } from './child.entity';

@ApiTags('children')
@Controller('children')
export class ChildController {
  constructor(
    private readonly childService: ChildService,
    private readonly parentService: ParentService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a child profile (requires active parent mode PIN)',
  })
  @ApiResponse({
    status: 201,
    description: 'Child created successfully',
    type: Child,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or parent mode not activated',
  })
  @ApiResponse({ status: 401, description: 'Invalid PIN or not authenticated' })
  async create(
    @Session() session: UserSession<typeof auth>,
    @Body() body: CreateChildDto & { pin: string },
  ): Promise<Child> {
    const parent = await this.parentService.findByUserId(session.user.id);
    await this.parentService.verifyPin(parent.id, body.pin);
    const { pin, ...dto } = body;
    void pin;
    return this.childService.create(parent.id, dto);
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

  @Get('my')
  @ApiOperation({
    summary: 'List children belonging to the authenticated parent',
  })
  @ApiResponse({ status: 200, description: 'List of children', type: [Child] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findMine(
    @Session() session: UserSession<typeof auth>,
  ): Promise<Child[]> {
    const parent = await this.parentService.findByUserId(session.user.id);
    return this.childService.findByParent(parent.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a child profile by ID' })
  @ApiParam({ name: 'id', description: 'Child UUIDv7' })
  @ApiResponse({ status: 200, description: 'Child found', type: Child })
  @ApiResponse({ status: 404, description: 'Child not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Child> {
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Child not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChildDto,
  ): Promise<Child> {
    return this.childService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a child profile' })
  @ApiParam({ name: 'id', description: 'Child UUIDv7' })
  @ApiResponse({ status: 204, description: 'Child deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Child not found' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.childService.remove(id);
  }
}

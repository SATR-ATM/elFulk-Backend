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
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChildService } from './child.service';
import { ParentService } from '../parent/parent.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';
import { VerifyPinDto } from '../parent/dto/verify-pin.dto';
import { Child } from './child.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('children')
@Controller('children')
export class ChildController {
  constructor(
    private readonly childService: ChildService,
    private readonly parentService: ParentService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a child profile (requires active parent mode PIN)',
  })
  @ApiResponse({ status: 201, description: 'Child created successfully', type: Child })
  @ApiResponse({ status: 400, description: 'Validation error or parent mode not activated' })
  @ApiResponse({ status: 401, description: 'Invalid PIN or not authenticated' })
  async create(
    @Request() req: { user: { id: string } },
    @Body() body: CreateChildDto & { pin: string },
  ): Promise<Child> {
    await this.parentService.verifyPin(req.user.id, body.pin);
    const { pin, ...dto } = body;
    void pin;
    return this.childService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all child profiles' })
  @ApiResponse({ status: 200, description: 'List of all children', type: [Child] })
  findAll(): Promise<Child[]> {
    return this.childService.findAll();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List children belonging to the authenticated parent' })
  @ApiResponse({ status: 200, description: 'List of children', type: [Child] })
  findMine(@Request() req: { user: { id: string } }): Promise<Child[]> {
    return this.childService.findByParent(req.user.id);
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a child profile (partial)' })
  @ApiParam({ name: 'id', description: 'Child UUIDv7' })
  @ApiResponse({ status: 200, description: 'Child updated successfully', type: Child })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Child not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChildDto,
  ): Promise<Child> {
    return this.childService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a child profile' })
  @ApiParam({ name: 'id', description: 'Child UUIDv7' })
  @ApiResponse({ status: 204, description: 'Child deleted successfully' })
  @ApiResponse({ status: 404, description: 'Child not found' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.childService.remove(id);
  }
}

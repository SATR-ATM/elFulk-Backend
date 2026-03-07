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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ActivityLogService } from './activity-log.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { UpdateActivityLogDto } from './dto/update-activity-log.dto';
import { ActivityLog } from './activity-log.entity';

@ApiTags('activity-logs')
@Controller('activity-logs')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Post()
  @ApiOperation({ summary: 'Create activity log' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateActivityLogDto): Promise<ActivityLog> {
    return this.activityLogService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all activity logs' })
  @ApiResponse({ status: 200, description: 'Success' })
  findAll(): Promise<ActivityLog[]> {
    return this.activityLogService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get activity log by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string): Promise<ActivityLog> {
    return this.activityLogService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update activity log' })
  @ApiResponse({ status: 200, description: 'Updated' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateActivityLogDto,
  ): Promise<ActivityLog> {
    return this.activityLogService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete activity log' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.activityLogService.remove(id);
  }
}

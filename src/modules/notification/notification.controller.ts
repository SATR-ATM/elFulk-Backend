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
import { NotificationService } from './notification.service';
import { ParentService } from '../parent/parent.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification } from './notification.entity';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly parentService: ParentService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a notification for a parent' })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully',
    type: Notification,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(
    @Session() session: UserSession<typeof auth>,
    @Body() dto: CreateNotificationDto,
  ): Promise<Notification> {
    const parent = await this.parentService.findByUserId(session.user.id);
    return this.notificationService.create(parent.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all notifications' })
  @ApiResponse({
    status: 200,
    description: 'List of all notifications',
    type: [Notification],
  })
  findAll(): Promise<Notification[]> {
    return this.notificationService.findAll();
  }

  @Get('my')
  @ApiOperation({
    summary: 'List notifications belonging to the authenticated parent',
  })
  @ApiResponse({
    status: 200,
    description: 'List of notifications',
    type: [Notification],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findMine(
    @Session() session: UserSession<typeof auth>,
  ): Promise<Notification[]> {
    const parent = await this.parentService.findByUserId(session.user.id);
    return this.notificationService.findByParent(parent.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a notification by ID' })
  @ApiParam({ name: 'id', description: 'Notification UUIDv7' })
  @ApiResponse({
    status: 200,
    description: 'Notification found',
    type: Notification,
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Notification> {
    return this.notificationService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a notification (partial)' })
  @ApiParam({ name: 'id', description: 'Notification UUIDv7' })
  @ApiResponse({
    status: 200,
    description: 'Notification updated successfully',
    type: Notification,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNotificationDto,
  ): Promise<Notification> {
    return this.notificationService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification UUIDv7' })
  @ApiResponse({
    status: 204,
    description: 'Notification deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.notificationService.remove(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { UpdateAdminRoleStatusDto } from './dto/update-admin-role-status.dto';
import { Admin } from './admin.entity';

@ApiTags('Admins')
@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new admin',
    description:
      'Registers a new admin account. Email must be unique. Password will be hashed before storage.',
  })
  @ApiBody({ type: CreateAdminDto })
  @ApiCreatedResponse({
    description: 'Admin account created successfully.',
    type: Admin,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or email is already in use.',
  })
  create(@Body() createAdminDto: CreateAdminDto): Promise<Admin> {
    return this.adminService.create(createAdminDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all admins',
    description: 'Returns a full list of all registered admin accounts.',
  })
  @ApiOkResponse({
    description: 'Admin list retrieved successfully.',
    type: [Admin],
  })
  findAll(): Promise<Admin[]> {
    return this.adminService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get an admin by ID',
    description: 'Fetches a single admin record by their UUID.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the admin to retrieve',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiOkResponse({ description: 'Admin found and returned.', type: Admin })
  @ApiNotFoundResponse({ description: 'No admin found with the provided ID.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Admin> {
    return this.adminService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update admin profile',
    description:
      'Partially updates profile fields only (name, email, password). Role and status are excluded from this endpoint.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the admin to update',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({ type: UpdateAdminDto })
  @ApiOkResponse({ description: 'Admin updated successfully.', type: Admin })
  @ApiNotFoundResponse({ description: 'No admin found with the provided ID.' })
  @ApiBadRequestResponse({
    description: 'Validation failed or email is already in use.',
  })
  updateProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ): Promise<Admin> {
    return this.adminService.updateProfile(id, updateAdminDto);
  }

  @Patch(':id/role-status')
  @ApiOperation({
    summary: 'Update role/status (super admin only)',
    description:
      'Privileged endpoint to update admin role or account status. Only SUPER_ADMIN is allowed to perform this action.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the admin to update role/status for',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({ type: UpdateAdminRoleStatusDto })
  @ApiOkResponse({
    description: 'Admin role/status updated successfully.',
    type: Admin,
  })
  @ApiNotFoundResponse({ description: 'Admin not found.' })
  @ApiBadRequestResponse({
    description: 'Invalid payload or self-escalation attempt.',
  })
  updateRoleStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateAdminRoleStatusDto,
  ): Promise<Admin> {
    return this.adminService.updateRoleAndStatus(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete an admin',
    description: 'Permanently removes an admin account by their UUID.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the admin to delete',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiOkResponse({ description: 'Admin deleted successfully.' })
  @ApiNotFoundResponse({ description: 'No admin found with the provided ID.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.remove(id);
  }

  @Patch(':id/approve')
  approveModerator(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('approverId', ParseUUIDPipe) approverId: string,
  ) {
    return this.adminService.approveModerator(id, approverId);
  }
}

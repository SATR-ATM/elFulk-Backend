import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
import { CreateAdminDto } from './create-admin.dto';
import { UpdateAdminDto } from './update-admin.dto';
import { Admin } from './admin.entity';

@ApiTags('Admins')
@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new admin',
    description: 'Registers a new admin account. Email must be unique. Password will be hashed before storage.',
  })
  @ApiBody({ type: CreateAdminDto })
  @ApiCreatedResponse({ description: 'Admin account created successfully.', type: Admin })
  @ApiBadRequestResponse({ description: 'Validation failed or email is already in use.' })
  create(@Body() createAdminDto: CreateAdminDto): Promise<Admin> {
    return this.adminService.create(createAdminDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all admins',
    description: 'Returns a full list of all registered admin accounts.',
  })
  @ApiOkResponse({ description: 'Admin list retrieved successfully.', type: [Admin] })
  findAll(): Promise<Admin[]> {
    return this.adminService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get an admin by ID',
    description: 'Fetches a single admin record by their UUID.',
  })
  @ApiParam({ name: 'id', description: 'UUID of the admin to retrieve', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'Admin found and returned.', type: Admin })
  @ApiNotFoundResponse({ description: 'No admin found with the provided ID.' })
  findOne(@Param('id') id: string): Promise<Admin> {
    return this.adminService.findone(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an admin',
    description: 'Partially updates an existing admin record. Only provided fields will be updated.',
  })
  @ApiParam({ name: 'id', description: 'UUID of the admin to update', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiBody({ type: UpdateAdminDto })
  @ApiOkResponse({ description: 'Admin updated successfully.', type: Admin })
  @ApiNotFoundResponse({ description: 'No admin found with the provided ID.' })
  @ApiBadRequestResponse({ description: 'Validation failed or email is already in use.' })
  update(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ): Promise<Admin> {
    return this.adminService.update(id, updateAdminDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete an admin',
    description: 'Permanently removes an admin account by their UUID.',
  })
  @ApiParam({ name: 'id', description: 'UUID of the admin to delete', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ description: 'Admin deleted successfully.' })
  @ApiNotFoundResponse({ description: 'No admin found with the provided ID.' })
  remove(@Param('id') id: string) {
    return this.adminService.remove(id);
  }
}
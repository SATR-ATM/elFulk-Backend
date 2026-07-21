import {
  Controller,
  Get,
  Post,
  Patch,
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
import { ParentService } from './parent.service';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { ActivatePinDto } from './dto/activate-pin.dto';
import { VerifyPinDto } from './dto/verify-pin.dto';
import { Parent } from './parent.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('parents')
@Controller('parents')
export class ParentController {
  constructor(private readonly parentService: ParentService) {}
  @Post()
  @ApiOperation({ summary: 'Create a parent account' })
  @ApiResponse({ status: 201, description: 'Parent created', type: Parent })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateParentDto): Promise<Parent> {
    return this.parentService.create(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated parent' })
  @ApiResponse({ status: 200, description: 'Parent profile', type: Parent })
  getMe(@Request() req: { user: { id: string } }): Promise<Parent> {
    return this.parentService.findById(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get parent by ID' })
  @ApiParam({ name: 'id', description: 'Parent UUID' })
  @ApiResponse({ status: 200, description: 'Parent found', type: Parent })
  @ApiResponse({ status: 404, description: 'Parent not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Parent> {
    return this.parentService.findById(id);
  }
  
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update parent (partial)' })
  @ApiParam({ name: 'id', description: 'Parent UUID' })
  @ApiResponse({ status: 200, description: 'Parent updated', type: Parent })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateParentDto,
  ): Promise<Parent> {
    return this.parentService.update(id, dto);
  }
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate parent mode with a PIN' })
  @ApiResponse({ status: 200, description: 'Parent mode activated' })
  @ApiResponse({ status: 400, description: 'Already activated or invalid PIN' })
  activatePin(
    @Request() req: { user: { id: string } },
    @Body() dto: ActivatePinDto,
  ): Promise<{ message: string }> {
    return this.parentService.activatePin(req.user.id, dto.pin);
  }
  @Post('verify-pin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify parent PIN' })
  @ApiResponse({ status: 200, description: 'PIN is valid' })
  @ApiResponse({ status: 401, description: 'Invalid PIN' })
  async verifyPin(
    @Request() req: { user: { id: string } },
    @Body() dto: VerifyPinDto,
  ): Promise<{ valid: boolean }> {
    await this.parentService
          .verifyPin(req.user.id, dto.pin);
      return ({ valid: true });
  }
}
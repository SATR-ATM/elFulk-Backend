import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/Login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ActivatePinDto } from '../parent/dto/activate-pin.dto';
import { ParentService } from '../parent/parent.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly parentService: ParentService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Parent login with email and password' })
  @ApiResponse({ status: 201, description: 'Returns JWT access token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated parent profile' })
  @ApiResponse({ status: 200, description: 'Authenticated parent profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Request() req: { user: { id: string } }) {
    return this.authService.getProfile(req.user.id);
  }

  @Post('activate-pin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate parent mode with a 4-digit PIN' })
  @ApiResponse({ status: 200, description: 'Parent mode activated successfully' })
  @ApiResponse({ status: 400, description: 'PIN already activated or invalid format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  activatePin(
    @Request() req: { user: { id: string } },
    @Body() dto: ActivatePinDto,
  ) {
    return this.parentService.activatePin(req.user.id, dto.pin);
  }
}

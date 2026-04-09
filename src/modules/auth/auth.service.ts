import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ParentService } from '../parent/parent.service';
import { LoginDto } from './dto/Login.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly parentService: ParentService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{ access_token: string }> {
    const parent = await this.parentService.findByEmail(dto.email);

    if (!parent || !parent.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const hash = crypto
      .createHash('sha256')
      .update(dto.password)
      .digest('hex');

    if (hash !== parent.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: parent.id, email: parent.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async getProfile(id: string) {
    return this.parentService.findById(id);
  }
}

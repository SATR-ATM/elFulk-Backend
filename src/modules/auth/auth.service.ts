import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ParentService } from '../parent/parent.service';
import { AdminService } from '../admin/admin.service';
import { ChildService } from '../child/child.service';
import { LoginDto } from '../auth/dto/login.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly parentService: ParentService,
    private readonly adminService: AdminService,
    private readonly childService: ChildService,
    private readonly jwtService: JwtService,
  ) { }

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

    const payload = { sub: parent.id, email: parent.email, role: 'parent' };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async adminLogin(dto: LoginDto): Promise<{ access_token: string }> {
    const admin = await this.adminService.findByEmailWithPassword(dto.email);
    if (!admin || !admin.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, admin.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: admin.id, email: admin.email, role: 'admin' };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async getChildToken(parentId: string, childId: string): Promise<{ access_token: string }> {
    const child = await this.childService.findOne(childId);
    if (child.parent_id !== parentId) {
      throw new ForbiddenException('Child does not belong to parent');
    }

    // Calculate age to determine ageGroup
    const birthYear = new Date(child.date_of_birth).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    let ageGroup = '3-5';
    if (age >= 12) ageGroup = '12+';
    else if (age >= 9) ageGroup = '9-11';
    else if (age >= 6) ageGroup = '6-8';

    const payload = { sub: child.id, parentId: child.parent_id, role: 'child', ageGroup };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async getProfile(id: string) {
    return this.parentService.findById(id);
  }
}

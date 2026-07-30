import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './admin.entity';
import { Parent } from '../parent/parent.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../../../typeorm/entities/User';

@Module({
  imports: [TypeOrmModule.forFeature([Admin, Parent, User])],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

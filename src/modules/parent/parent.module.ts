import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parent } from './parent.entity';
import { ParentService } from './parent.service';

@Module({
  imports: [TypeOrmModule.forFeature([Parent])],
  providers: [ParentService],
  exports: [ParentService],
})
export class ParentModule {}
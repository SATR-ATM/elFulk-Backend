import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parent } from './parent.entity';
import { ParentService } from './parent.service';
import { ParentController } from './parent.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Parent])],
  controllers: [ParentController],
  providers: [ParentService],
  exports: [ParentService],
})
export class ParentModule {}
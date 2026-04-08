import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Child } from './child.entity';
import { ChildService } from './child.service';
import { ChildController } from './child.controller';
import { ParentModule } from '../parent/parent.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Child]),
    ParentModule,
  ],
  controllers: [ChildController],
  providers: [ChildService],
  exports: [ChildService],
})
export class ChildModule {}
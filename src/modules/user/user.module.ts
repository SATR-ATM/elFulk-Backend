import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './user.entity';
import { UsersService } from './user.service';
import { UsersController } from './user.controller';
import { Session } from '../session/session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Users, Session])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}

import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '../user/user.entity';
import { Session } from './session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Users, Session])],
  controllers: [SessionController],
  providers: [SessionService],
})
export class SessionModule {}

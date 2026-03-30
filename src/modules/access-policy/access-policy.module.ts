import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessPolicy } from './access-policy.entity';
import { AccessPolicyService } from './access-policy.service';
import { AccessPolicyController } from './access-policy.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AccessPolicy])],
  providers: [AccessPolicyService],
  controllers: [AccessPolicyController],
})
export class AccessPolicyModule {}
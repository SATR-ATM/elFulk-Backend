import { Module } from '@nestjs/common';
import { AccessPolicyService } from './access-policy.service';
import { AccessPolicyController } from './access-policy.controller';

@Module({
  controllers: [AccessPolicyController],
  providers: [AccessPolicyService],
})
export class AccessPolicyModule {}

import { Test, TestingModule } from '@nestjs/testing';
import { AccessPolicyService } from './access-policy.service';

describe('AccessPolicyService', () => {
  let service: AccessPolicyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccessPolicyService],
    }).compile();

    service = module.get<AccessPolicyService>(AccessPolicyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

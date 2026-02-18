import { Test, TestingModule } from '@nestjs/testing';
import { AccessPolicyController } from './access-policy.controller';
import { AccessPolicyService } from './access-policy.service';

describe('AccessPolicyController', () => {
  let controller: AccessPolicyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccessPolicyController],
      providers: [AccessPolicyService],
    }).compile();

    controller = module.get<AccessPolicyController>(AccessPolicyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

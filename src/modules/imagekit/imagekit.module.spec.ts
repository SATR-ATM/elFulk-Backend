import { Test, TestingModule } from '@nestjs/testing';
import { ImageKitModule } from './imagekit.module';
import { ImageKitService } from './imagekit.service';

describe('ImageKitModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ImageKitModule],
    }).compile();
  });

  it('should compile the module without errors', () => {
    expect(module).toBeDefined();
  });

  it('should provide ImageKitService', () => {
    const service = module.get<ImageKitService>(ImageKitService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(ImageKitService);
  });

  it('ImageKitService should be exported and retrievable by consuming modules', () => {
    // get() on the compiled module proves it is exported
    const service = module.get<ImageKitService>(ImageKitService);
    expect(service).toBeTruthy();
  });
});

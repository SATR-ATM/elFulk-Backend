import { Module } from '@nestjs/common';
import { ImageKitService } from './imagekit.service';

@Module({
  providers: [ImageKitService],
  exports: [ImageKitService],
})
export class ImageKitModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaAsset } from './media.entity';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { ImageKitModule } from '../imagekit/imagekit.module';

@Module({
  imports: [TypeOrmModule.forFeature([MediaAsset]), ImageKitModule],
  providers: [MediaService],
  controllers: [MediaController],
  exports: [MediaService],
})
export class MediaModule {}

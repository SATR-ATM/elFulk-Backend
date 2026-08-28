import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaAsset } from './media.entity';
import { ImageKitService } from '../imagekit/imagekit.service';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(MediaAsset)
    private readonly mediaRepository: Repository<MediaAsset>,
    private readonly imageKitService: ImageKitService,
  ) {}

  getUploadAuth() {
    return this.imageKitService.getAuthParameters();
  }

  async createAsset(attributes: Partial<MediaAsset>) {
    return this.mediaRepository.save(this.mediaRepository.create(attributes));
  }

  async findByStoryId(storyId: string) {
    return this.mediaRepository.find({ where: { story_id: storyId } });
  }

  signFileUrl(fileUrl: string) {
    return this.imageKitService.getSignedUrl(fileUrl);
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaService } from './media.service';
import { MediaAsset } from './media.entity';
import { ImageKitService } from '../imagekit/imagekit.service';

const mockMediaRepository = () => ({
  save: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
});

const mockImageKitService = () => ({
  getAuthParameters: jest.fn(),
  getSignedUrl: jest.fn(),
});

type MockRepo<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('MediaService', () => {
  let service: MediaService;
  let mediaRepo: MockRepo<MediaAsset>;
  let imagekitService: ReturnType<typeof mockImageKitService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: getRepositoryToken(MediaAsset),
          useFactory: mockMediaRepository,
        },
        {
          provide: ImageKitService,
          useFactory: mockImageKitService,
        },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
    mediaRepo = module.get(getRepositoryToken(MediaAsset));
    imagekitService = module.get(ImageKitService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getUploadAuth ────────────────────────────────────────────────────────

  describe('getUploadAuth()', () => {
    it('should delegate to ImageKitService.getAuthParameters()', async () => {
      const authPayload = {
        token: 'abc123',
        expires: 1700000000,
        signature: 'sig',
        publicKey: 'pub',
      };
      (imagekitService.getAuthParameters as jest.Mock).mockReturnValue(authPayload);

      const result = await service.getUploadAuth();

      expect(imagekitService.getAuthParameters).toHaveBeenCalledTimes(1);
      expect(result).toEqual(authPayload);
    });

    it('should return token, expires, signature and publicKey', async () => {
      const authPayload = {
        token: 'tok',
        expires: 9999,
        signature: 's',
        publicKey: 'pk',
      };
      (imagekitService.getAuthParameters as jest.Mock).mockReturnValue(authPayload);

      const result = await service.getUploadAuth();

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expires');
      expect(result).toHaveProperty('signature');
      expect(result).toHaveProperty('publicKey');
    });
  });

  // ─── createAsset ─────────────────────────────────────────────────────────

  describe('createAsset()', () => {
    it('should create and save a media asset', async () => {
      const attrs: Partial<MediaAsset> = {
        file_name: 'cover.jpg',
        file_url: 'https://ik.imagekit.io/demo/cover.jpg',
        story_id: 'story-uuid',
      };
      const created = { id: 'media-uuid', ...attrs };
      (mediaRepo.create as jest.Mock).mockReturnValue(created);
      (mediaRepo.save as jest.Mock).mockResolvedValue(created);

      const result = await service.createAsset(attrs);

      expect(mediaRepo.create).toHaveBeenCalledWith(attrs);
      expect(mediaRepo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });

    it('should persist file_name and file_url on the returned asset', async () => {
      const attrs: Partial<MediaAsset> = {
        file_name: 'thumbnail.png',
        file_url: 'https://example.com/thumb.png',
      };
      const saved = { id: 'uuid-1', ...attrs };
      (mediaRepo.create as jest.Mock).mockReturnValue(saved);
      (mediaRepo.save as jest.Mock).mockResolvedValue(saved);

      const result = await service.createAsset(attrs);

      expect(result.file_name).toBe('thumbnail.png');
      expect(result.file_url).toBe('https://example.com/thumb.png');
    });
  });

  // ─── findByStoryId ────────────────────────────────────────────────────────

  describe('findByStoryId()', () => {
    it('should query assets filtered by story_id', async () => {
      const storyId = 'story-uuid-123';
      const assets: Partial<MediaAsset>[] = [
        { id: 'a1', story_id: storyId, file_name: 'img1.jpg', file_url: 'url1' },
        { id: 'a2', story_id: storyId, file_name: 'img2.jpg', file_url: 'url2' },
      ];
      (mediaRepo.find as jest.Mock).mockResolvedValue(assets);

      const result = await service.findByStoryId(storyId);

      expect(mediaRepo.find).toHaveBeenCalledWith({ where: { story_id: storyId } });
      expect(result).toHaveLength(2);
    });

    it('should return an empty array when no assets exist for the story', async () => {
      (mediaRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await service.findByStoryId('nonexistent-story');

      expect(result).toEqual([]);
    });
  });

  // ─── signFileUrl ──────────────────────────────────────────────────────────

  describe('signFileUrl()', () => {
    it('should delegate to ImageKitService.getSignedUrl()', () => {
      const raw = 'https://ik.imagekit.io/demo/cover.jpg';
      const signed = `${raw}?ik-t=1234&ik-s=abcdef`;
      (imagekitService.getSignedUrl as jest.Mock).mockReturnValue(signed);

      const result = service.signFileUrl(raw);

      expect(imagekitService.getSignedUrl).toHaveBeenCalledWith(raw);
      expect(result).toBe(signed);
    });

    it('should return the raw path when ImageKitService returns it unchanged', () => {
      const raw = 'some/path.png';
      (imagekitService.getSignedUrl as jest.Mock).mockReturnValue(raw);

      expect(service.signFileUrl(raw)).toBe(raw);
    });
  });
});

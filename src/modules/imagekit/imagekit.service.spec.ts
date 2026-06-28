import { Test, TestingModule } from '@nestjs/testing';
import { ImageKitService } from './imagekit.service';

describe('ImageKitService', () => {
  let service: ImageKitService;

  const PRIVATE_KEY = 'test_private_key';
  const PUBLIC_KEY = 'test_public_key';
  const URL_ENDPOINT = 'https://ik.imagekit.io/demo';

  beforeEach(async () => {
    process.env.IMAGEKIT_PRIVATE_KEY = PRIVATE_KEY;
    process.env.IMAGEKIT_PUBLIC_KEY = PUBLIC_KEY;
    process.env.IMAGEKIT_URL_ENDPOINT = URL_ENDPOINT;

    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageKitService],
    }).compile();

    service = module.get<ImageKitService>(ImageKitService);
  });

  afterEach(() => {
    delete process.env.IMAGEKIT_PRIVATE_KEY;
    delete process.env.IMAGEKIT_PUBLIC_KEY;
    delete process.env.IMAGEKIT_URL_ENDPOINT;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getAuthParameters ────────────────────────────────────────────────────

  describe('getAuthParameters()', () => {
    it('should return token, expires, signature, and publicKey', () => {
      const result = service.getAuthParameters();

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expires');
      expect(result).toHaveProperty('signature');
      expect(result).toHaveProperty('publicKey');
    });

    it('should return a 32-character hex token', () => {
      const { token } = service.getAuthParameters();
      expect(token).toMatch(/^[0-9a-f]{32}$/);
    });

    it('should return publicKey matching the env variable', () => {
      const { publicKey } = service.getAuthParameters();
      expect(publicKey).toBe(PUBLIC_KEY);
    });

    it('should return an expires value ~10 minutes in the future', () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const { expires } = service.getAuthParameters();

      expect(expires).toBeGreaterThanOrEqual(nowSeconds + 590);
      expect(expires).toBeLessThanOrEqual(nowSeconds + 610);
    });

    it('should return a non-empty sha256 hex signature', () => {
      const { signature } = service.getAuthParameters();
      expect(signature).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should return a different token on each call', () => {
      const first = service.getAuthParameters();
      const second = service.getAuthParameters();
      expect(first.token).not.toBe(second.token);
    });

    it('should return empty publicKey when IMAGEKIT_PUBLIC_KEY is not set', () => {
      delete process.env.IMAGEKIT_PUBLIC_KEY;
      const { publicKey } = service.getAuthParameters();
      expect(publicKey).toBe('');
    });

    it('should still return a signature when IMAGEKIT_PRIVATE_KEY is not set', () => {
      delete process.env.IMAGEKIT_PRIVATE_KEY;
      const result = service.getAuthParameters();
      // HMAC with empty string key still produces a valid hex digest
      expect(result.signature).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  // ─── getSignedUrl ─────────────────────────────────────────────────────────

  describe('getSignedUrl()', () => {
    it('should return a signed URL containing ik-t and ik-s query params', () => {
      const path = 'my-folder/image.jpg';
      const result = service.getSignedUrl(path);

      expect(result).toContain('ik-t=');
      expect(result).toContain('ik-s=');
    });

    it('should prepend the endpoint to a plain path', () => {
      const path = 'my-folder/image.jpg';
      const result = service.getSignedUrl(path);

      expect(result.startsWith(`${URL_ENDPOINT}/`)).toBe(true);
    });

    it('should strip the endpoint prefix if the path already starts with it', () => {
      const path = `${URL_ENDPOINT}/my-folder/image.jpg`;
      const result = service.getSignedUrl(path);

      // The result should start with the endpoint but NOT repeat it twice
      expect(result.startsWith(`${URL_ENDPOINT}/my-folder/image.jpg`)).toBe(true);
      expect(result).not.toContain(`${URL_ENDPOINT}/${URL_ENDPOINT}`);
    });

    it('should return the raw path when endpoint is missing', () => {
      delete process.env.IMAGEKIT_URL_ENDPOINT;
      const path = 'some/image.png';
      const result = service.getSignedUrl(path);
      expect(result).toBe(path);
    });

    it('should return the raw path when private key is missing', () => {
      delete process.env.IMAGEKIT_PRIVATE_KEY;
      const path = 'some/image.png';
      const result = service.getSignedUrl(path);
      expect(result).toBe(path);
    });

    it('should produce a signature that is a sha256 hex digest', () => {
      const result = service.getSignedUrl('assets/cover.jpg');
      const match = result.match(/ik-s=([0-9a-f]+)/);
      expect(match).not.toBeNull();
      expect(match![1]).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should set ik-t ~1 hour in the future', () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const result = service.getSignedUrl('assets/cover.jpg');
      const match = result.match(/ik-t=(\d+)/);
      expect(match).not.toBeNull();
      const expires = parseInt(match![1], 10);
      expect(expires).toBeGreaterThanOrEqual(nowSeconds + 3590);
      expect(expires).toBeLessThanOrEqual(nowSeconds + 3610);
    });

    it('should handle a path with a leading slash after endpoint stripping', () => {
      const path = `${URL_ENDPOINT}/leading/slash.jpg`;
      const result = service.getSignedUrl(path);
      expect(result).not.toContain('//leading');
    });
  });
});

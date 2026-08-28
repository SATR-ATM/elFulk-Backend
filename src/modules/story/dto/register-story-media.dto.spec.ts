import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterStoryMediaDto } from './register-story-media.dto';

const valid = (overrides: Partial<RegisterStoryMediaDto> = {}): RegisterStoryMediaDto =>
  plainToInstance(RegisterStoryMediaDto, {
    file_name: 'cover.jpg',
    file_url: 'https://ik.imagekit.io/demo/cover.jpg',
    ...overrides,
  });

describe('RegisterStoryMediaDto', () => {
  // ─── file_name ───────────────────────────────────────────────────────────

  it('should pass with file_name and file_url', async () => {
    const errors = await validate(valid());
    expect(errors).toHaveLength(0);
  });

  it('should fail when file_name is missing', async () => {
    const dto = plainToInstance(RegisterStoryMediaDto, {
      file_url: 'https://ik.imagekit.io/demo/cover.jpg',
    });
    const errors = await validate(dto);
    expect(errors.find((e) => e.property === 'file_name')).toBeDefined();
  });

  it('should fail when file_name is empty string', async () => {
    const errors = await validate(valid({ file_name: '' }));
    expect(errors.find((e) => e.property === 'file_name')).toBeDefined();
  });

  it('should fail when file_name is not a string', async () => {
    const dto = plainToInstance(RegisterStoryMediaDto, {
      file_name: 99,
      file_url: 'https://example.com/img.jpg',
    });
    const errors = await validate(dto);
    expect(errors.find((e) => e.property === 'file_name')).toBeDefined();
  });

  // ─── file_url ────────────────────────────────────────────────────────────

  it('should fail when file_url is missing', async () => {
    const dto = plainToInstance(RegisterStoryMediaDto, { file_name: 'img.jpg' });
    const errors = await validate(dto);
    expect(errors.find((e) => e.property === 'file_url')).toBeDefined();
  });

  it('should fail when file_url is not a valid URL', async () => {
    const errors = await validate(valid({ file_url: 'not-a-url' }));
    expect(errors.find((e) => e.property === 'file_url')).toBeDefined();
  });

  it('should fail when file_url is an empty string', async () => {
    const errors = await validate(valid({ file_url: '' }));
    expect(errors.find((e) => e.property === 'file_url')).toBeDefined();
  });

  // ─── content_type (optional) ─────────────────────────────────────────────

  it('should pass when content_type is a valid string', async () => {
    const errors = await validate(valid({ content_type: 'image/jpeg' }));
    expect(errors).toHaveLength(0);
  });

  it('should pass when content_type is omitted', async () => {
    const errors = await validate(valid());
    expect(errors).toHaveLength(0);
  });

  it('should fail when content_type is a number', async () => {
    const dto = plainToInstance(RegisterStoryMediaDto, {
      file_name: 'img.jpg',
      file_url: 'https://example.com/img.jpg',
      content_type: 42,
    });
    const errors = await validate(dto);
    expect(errors.find((e) => e.property === 'content_type')).toBeDefined();
  });

  // ─── file_size (optional) ────────────────────────────────────────────────

  it('should pass when file_size is a positive integer', async () => {
    const errors = await validate(valid({ file_size: 1024 }));
    expect(errors).toHaveLength(0);
  });

  it('should pass when file_size is 0', async () => {
    const errors = await validate(valid({ file_size: 0 }));
    expect(errors).toHaveLength(0);
  });

  it('should fail when file_size is negative', async () => {
    const errors = await validate(valid({ file_size: -1 }));
    expect(errors.find((e) => e.property === 'file_size')).toBeDefined();
  });

  it('should fail when file_size is a float', async () => {
    const errors = await validate(valid({ file_size: 1.5 }));
    expect(errors.find((e) => e.property === 'file_size')).toBeDefined();
  });

  it('should pass when file_size is omitted', async () => {
    const errors = await validate(valid());
    expect(errors).toHaveLength(0);
  });

  // ─── full valid payload ──────────────────────────────────────────────────

  it('should pass a fully populated valid payload', async () => {
    const errors = await validate(
      valid({
        content_type: 'image/png',
        file_size: 204800,
      }),
    );
    expect(errors).toHaveLength(0);
  });
});

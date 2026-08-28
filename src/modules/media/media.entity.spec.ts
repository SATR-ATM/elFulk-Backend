import { MediaAsset } from './media.entity';

describe('MediaAsset entity', () => {
  it('should auto-assign an id via ensureId() when id is not set', () => {
    const asset = new MediaAsset();
    asset.ensureId();
    expect(asset.id).toBeDefined();
    expect(typeof asset.id).toBe('string');
    expect(asset.id.length).toBeGreaterThan(0);
  });

  it('should NOT overwrite an existing id when ensureId() is called', () => {
    const asset = new MediaAsset();
    asset.id = 'preset-uuid';
    asset.ensureId();
    expect(asset.id).toBe('preset-uuid');
  });

  it('should generate unique ids for different instances', () => {
    const a = new MediaAsset();
    const b = new MediaAsset();
    a.ensureId();
    b.ensureId();
    expect(a.id).not.toBe(b.id);
  });

  it('should allow setting file_name and file_url', () => {
    const asset = new MediaAsset();
    asset.file_name = 'cover.jpg';
    asset.file_url = 'https://ik.imagekit.io/demo/cover.jpg';

    expect(asset.file_name).toBe('cover.jpg');
    expect(asset.file_url).toBe('https://ik.imagekit.io/demo/cover.jpg');
  });

  it('should allow story_id to be null', () => {
    const asset = new MediaAsset();
    asset.story_id = null;
    expect(asset.story_id).toBeNull();
  });

  it('should allow content_type to be null', () => {
    const asset = new MediaAsset();
    asset.content_type = null;
    expect(asset.content_type).toBeNull();
  });

  it('should allow file_size to be null', () => {
    const asset = new MediaAsset();
    asset.file_size = null;
    expect(asset.file_size).toBeNull();
  });

  it('should accept a numeric file_size', () => {
    const asset = new MediaAsset();
    asset.file_size = 204800;
    expect(asset.file_size).toBe(204800);
  });
});

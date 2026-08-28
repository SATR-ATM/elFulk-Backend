import { Story } from './story.entity';

describe('Story entity', () => {
  it('should auto-assign an id via ensureId() if one is not present', () => {
    const story = new Story();
    story.ensureId();
    expect(story.id).toBeDefined();
    expect(typeof story.id).toBe('string');
    expect(story.id.length).toBeGreaterThan(0);
  });

  it('should NOT overwrite an existing id when ensureId() is called', () => {
    const story = new Story();
    story.id = 'existing-uuid';
    story.ensureId();
    expect(story.id).toBe('existing-uuid');
  });

  it('should generate a unique id on each ensureId() call for different instances', () => {
    const a = new Story();
    const b = new Story();
    a.ensureId();
    b.ensureId();
    expect(a.id).not.toBe(b.id);
  });

  it('should have is_published default to undefined before persistence (boolean field)', () => {
    const story = new Story();
    // Before @BeforeInsert or DB default, the value is not set in TS
    expect(story.is_published).toBeUndefined();
  });

  it('should allow setting required fields', () => {
    const story = new Story();
    story.title = 'The Lion King';
    story.description = 'A great story';
    story.content = 'Once upon a time…';
    story.is_published = false;

    expect(story.title).toBe('The Lion King');
    expect(story.description).toBe('A great story');
    expect(story.content).toBe('Once upon a time…');
    expect(story.is_published).toBe(false);
  });

  it('should allow all optional fields to be null', () => {
    const story = new Story();
    story.description = null;
    story.content = null;
    story.age_group = null;
    story.complexity = null;
    story.gender = null;
    story.type = null;
    story.author_id = null;
    story.deleted_at = null;

    expect(story.description).toBeNull();
    expect(story.content).toBeNull();
    expect(story.age_group).toBeNull();
    expect(story.complexity).toBeNull();
    expect(story.gender).toBeNull();
    expect(story.type).toBeNull();
    expect(story.author_id).toBeNull();
    expect(story.deleted_at).toBeNull();
  });
});

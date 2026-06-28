import { AssignedStory } from './assigned-story.entity';

describe('AssignedStory entity', () => {
  it('should auto-assign an id via ensureId() when id is not set', () => {
    const entity = new AssignedStory();
    entity.ensureId();
    expect(entity.id).toBeDefined();
    expect(typeof entity.id).toBe('string');
    expect(entity.id.length).toBeGreaterThan(0);
  });

  it('should NOT overwrite an existing id when ensureId() is called', () => {
    const entity = new AssignedStory();
    entity.id = 'fixed-uuid';
    entity.ensureId();
    expect(entity.id).toBe('fixed-uuid');
  });

  it('should generate unique ids for different instances', () => {
    const a = new AssignedStory();
    const b = new AssignedStory();
    a.ensureId();
    b.ensureId();
    expect(a.id).not.toBe(b.id);
  });

  it('should allow setting story_id and assignee_id', () => {
    const entity = new AssignedStory();
    entity.story_id = 'story-uuid';
    entity.assignee_id = 'child-uuid';

    expect(entity.story_id).toBe('story-uuid');
    expect(entity.assignee_id).toBe('child-uuid');
  });

  it('should allow assigned_by to be null', () => {
    const entity = new AssignedStory();
    entity.assigned_by = null;
    expect(entity.assigned_by).toBeNull();
  });

  it('should allow due_date to be null', () => {
    const entity = new AssignedStory();
    entity.due_date = null;
    expect(entity.due_date).toBeNull();
  });

  it('should allow due_date to be set to a valid Date', () => {
    const entity = new AssignedStory();
    const d = new Date('2025-12-31');
    entity.due_date = d;
    expect(entity.due_date).toEqual(d);
  });

  it('should have is_completed as undefined before persistence', () => {
    const entity = new AssignedStory();
    expect(entity.is_completed).toBeUndefined();
  });

  it('should allow is_completed to be set to true', () => {
    const entity = new AssignedStory();
    entity.is_completed = true;
    expect(entity.is_completed).toBe(true);
  });
});

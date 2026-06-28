import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateStoryDto } from './create-story.dto';

const valid = (overrides: Partial<CreateStoryDto> = {}): CreateStoryDto =>
  plainToInstance(CreateStoryDto, { title: 'My Story', ...overrides });

describe('CreateStoryDto', () => {
  // ─── title ──────────────────────────────────────────────────────────────

  it('should pass with only a title', async () => {
    const errors = await validate(valid());
    expect(errors).toHaveLength(0);
  });

  it('should fail when title is missing', async () => {
    const dto = plainToInstance(CreateStoryDto, {});
    const errors = await validate(dto);
    const titleError = errors.find((e) => e.property === 'title');
    expect(titleError).toBeDefined();
  });

  it('should fail when title is an empty string', async () => {
    const errors = await validate(valid({ title: '' }));
    const titleError = errors.find((e) => e.property === 'title');
    expect(titleError).toBeDefined();
  });

  it('should fail when title is not a string', async () => {
    const dto = plainToInstance(CreateStoryDto, { title: 123 });
    const errors = await validate(dto);
    const titleError = errors.find((e) => e.property === 'title');
    expect(titleError).toBeDefined();
  });

  // ─── optional string fields ──────────────────────────────────────────────

  const optionalStringFields = [
  'description',
  'content',
  'age_group',
  'complexity',
  'gender',
  'type',
] as const;

type OptionalStringField = (typeof optionalStringFields)[number];

  it.each(optionalStringFields)(
    'should pass when %s is provided as a string',
    async (field: OptionalStringField) => {
      const errors = await validate(
        valid({ [field]: 'some-value' } as Partial<CreateStoryDto>),
      );
      expect(errors).toHaveLength(0);
    },
  );

  it.each(optionalStringFields)(
    'should pass when %s is omitted (optional)',
    async (field: OptionalStringField) => {
      const dto = valid();
      delete (dto as Partial<CreateStoryDto>)[field];
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    },
  );

  it.each(optionalStringFields)(
    'should fail when %s is a number instead of string',
    async (field: OptionalStringField) => {
      const dto = plainToInstance(CreateStoryDto, {
        title: 'T',
        [field]: 42,
      } as Partial<CreateStoryDto>);
      const errors = await validate(dto);
      const fieldError = errors.find((e) => e.property === field);
      expect(fieldError).toBeDefined();
    },
  );

  // ─── author_id ───────────────────────────────────────────────────────────

  it('should pass when author_id is a valid UUID', async () => {
    const errors = await validate(valid({ author_id: '123e4567-e89b-12d3-a456-426614174000' }));
    expect(errors).toHaveLength(0);
  });

  it('should fail when author_id is not a valid UUID', async () => {
    const errors = await validate(valid({ author_id: 'not-a-uuid' }));
    const authorError = errors.find((e) => e.property === 'author_id');
    expect(authorError).toBeDefined();
  });

  it('should pass when author_id is omitted', async () => {
    const errors = await validate(valid());
    expect(errors).toHaveLength(0);
  });

  // ─── full valid payload ──────────────────────────────────────────────────

  it('should pass with a fully populated valid payload', async () => {
    const errors = await validate(
      valid({
        description: 'A story description',
        content: 'Once upon a time…',
        age_group: '4-6',
        complexity: 'easy',
        gender: 'female',
        type: 'fairy tale',
        author_id: '123e4567-e89b-12d3-a456-426614174000',
      }),
    );
    expect(errors).toHaveLength(0);
  });
});

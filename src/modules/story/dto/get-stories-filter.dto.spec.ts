import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { GetStoriesFilterDto } from './get-stories-filter.dto';

const dto = (overrides: Partial<GetStoriesFilterDto> = {}): GetStoriesFilterDto =>
  plainToInstance(GetStoriesFilterDto, overrides);

describe('GetStoriesFilterDto', () => {
  // ─── all empty / omitted ─────────────────────────────────────────────────

  it('should pass with an empty object (all fields optional)', async () => {
    expect(await validate(dto())).toHaveLength(0);
  });

  // ─── ageGroup ────────────────────────────────────────────────────────────

  it('should pass when ageGroup is a valid string', async () => {
    expect(await validate(dto({ ageGroup: '6-8' }))).toHaveLength(0);
  });

  it('should fail when ageGroup is a number', async () => {
    const errors = await validate(plainToInstance(GetStoriesFilterDto, { ageGroup: 6 }));
    expect(errors.find((e) => e.property === 'ageGroup')).toBeDefined();
  });

  // ─── complexity ──────────────────────────────────────────────────────────

  it('should pass when complexity is a valid string', async () => {
    expect(await validate(dto({ complexity: 'easy' }))).toHaveLength(0);
  });

  it('should fail when complexity is a number', async () => {
    const errors = await validate(plainToInstance(GetStoriesFilterDto, { complexity: 1 }));
    expect(errors.find((e) => e.property === 'complexity')).toBeDefined();
  });

  // ─── gender ──────────────────────────────────────────────────────────────

  it('should pass when gender is a valid string', async () => {
    expect(await validate(dto({ gender: 'female' }))).toHaveLength(0);
  });

  it('should fail when gender is a number', async () => {
    const errors = await validate(plainToInstance(GetStoriesFilterDto, { gender: 0 }));
    expect(errors.find((e) => e.property === 'gender')).toBeDefined();
  });

  // ─── type ────────────────────────────────────────────────────────────────

  it('should pass when type is a valid string', async () => {
    expect(await validate(dto({ type: 'fairy tale' }))).toHaveLength(0);
  });

  it('should fail when type is a number', async () => {
    const errors = await validate(plainToInstance(GetStoriesFilterDto, { type: 99 }));
    expect(errors.find((e) => e.property === 'type')).toBeDefined();
  });

  // ─── full valid payload ──────────────────────────────────────────────────

  it('should pass with all four filters provided', async () => {
    const errors = await validate(
      dto({ ageGroup: '9-11', complexity: 'hard', gender: 'all', type: 'adventure' }),
    );
    expect(errors).toHaveLength(0);
  });
});

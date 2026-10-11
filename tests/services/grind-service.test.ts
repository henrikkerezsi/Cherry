import type { GrindUnit } from '../../src/models';
import {
  grindGroupKey,
  isGrindComparable,
  isGrindWithinScale,
  partitionByGrindGroup,
} from '../../src/services/grind-service';

function reference(
  grinderId: number | null,
  grindSettingId: number | null,
  grindUnit: GrindUnit | null
) {
  return { grinderId, grindSettingId, grindUnit };
}

describe('grindGroupKey', () => {
  it('groups a reading by grinder, setting and unit', () => {
    expect(grindGroupKey(reference(4, 2, 'clicks'))).toBe('4/2/clicks');
  });

  it('yields null without a grinder, because the scale is unknown', () => {
    expect(grindGroupKey(reference(null, 2, 'clicks'))).toBeNull();
  });

  it('yields null without a grind setting, because named scales are the unit', () => {
    expect(grindGroupKey(reference(4, null, 'clicks'))).toBeNull();
  });

  it('yields null for the unknown unit', () => {
    expect(grindGroupKey(reference(4, 2, 'unknown'))).toBeNull();
  });
});

describe('isGrindComparable', () => {
  it('treats two readings on the same named scale as comparable', () => {
    expect(isGrindComparable(reference(4, 2, 'clicks'), reference(4, 2, 'clicks'))).toBe(true);
  });

  it('never compares a click count to a micron value', () => {
    expect(isGrindComparable(reference(4, 2, 'clicks'), reference(4, 2, 'microns'))).toBe(false);
  });

  it('never compares the same setting number on two different grinders', () => {
    expect(isGrindComparable(reference(4, 2, 'clicks'), reference(9, 2, 'clicks'))).toBe(false);
  });

  it('never compares two settings on the same grinder', () => {
    expect(isGrindComparable(reference(4, 2, 'clicks'), reference(4, 7, 'clicks'))).toBe(false);
  });

  it('is false when either side cannot be placed', () => {
    expect(isGrindComparable(reference(4, null, 'clicks'), reference(4, null, 'clicks'))).toBe(false);
  });
});

describe('partitionByGrindGroup', () => {
  it('pools only readings sharing a scale and drops the unplaceable ones', () => {
    const groups = partitionByGrindGroup([
      { id: 1, grinderId: 4, grindSettingId: 2, grindUnit: 'clicks' },
      { id: 2, grinderId: 4, grindSettingId: 2, grindUnit: 'clicks' },
      { id: 3, grinderId: 4, grindSettingId: 2, grindUnit: 'microns' },
      { id: 4, grinderId: 9, grindSettingId: 3, grindUnit: 'clicks' },
      { id: 5, grinderId: null, grindSettingId: null, grindUnit: 'unknown' },
    ]);

    expect(groups.size).toBe(3);
    expect(groups.get('4/2/clicks')?.map((entry) => entry.id)).toEqual([1, 2]);
    expect(groups.get('4/2/microns')?.map((entry) => entry.id)).toEqual([3]);
    expect(groups.get('9/3/clicks')?.map((entry) => entry.id)).toEqual([4]);
  });
});

describe('isGrindWithinScale', () => {
  it('accepts any value when the scale size is unknown', () => {
    expect(isGrindWithinScale(99, 'clicks', null, false)).toBe(true);
  });

  it('counts from one when the scale is one-based', () => {
    expect(isGrindWithinScale(1, 'clicks', 40, false)).toBe(true);
    expect(isGrindWithinScale(40, 'clicks', 40, false)).toBe(true);
    expect(isGrindWithinScale(41, 'clicks', 40, false)).toBe(false);
  });

  it('counts from zero when the scale is zero-based', () => {
    expect(isGrindWithinScale(0, 'setting', 11, true)).toBe(true);
    expect(isGrindWithinScale(11, 'setting', 11, true)).toBe(true);
    expect(isGrindWithinScale(12, 'setting', 11, true)).toBe(false);
  });

  it('does not range-check microns, where the scale size is a different unit', () => {
    expect(isGrindWithinScale(900, 'microns', 40, false)).toBe(true);
  });
});
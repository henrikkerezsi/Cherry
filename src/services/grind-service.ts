import type { GrindUnit } from '../models';

export interface GrindReference {
  grinderId: number | null;
  grindSettingId: number | null;
  grindUnit: GrindUnit | null;
}

/**
 * The identity of a comparable grind scale.
 *
 * idea.txt §7.2 makes this an enforced invariant: the recommender may only reason
 * about `grind_value` within one `(grinder_id, grind_setting_id, grind_unit)`
 * group, and must never compare a click count to a micron value. Grind is the
 * only knob with this restriction.
 *
 * A missing grinder, setting or unit yields `null`, because a grind reading that
 * cannot be placed on a known scale cannot be grouped at all — grouping it under
 * a placeholder would silently pool unrelated readings.
 */
export function grindGroupKey(reference: GrindReference): string | null {
  if (reference.grinderId === null) {
    return null;
  }
  if (reference.grindSettingId === null) {
    return null;
  }
  if (reference.grindUnit === null || reference.grindUnit === 'unknown') {
    return null;
  }
  return `${reference.grinderId}/${reference.grindSettingId}/${reference.grindUnit}`;
}

export function isGrindComparable(left: GrindReference, right: GrindReference): boolean {
  const leftKey = grindGroupKey(left);
  return leftKey !== null && leftKey === grindGroupKey(right);
}

/**
 * Groups entries that share a comparable grind scale, dropping the ones that
 * cannot be placed. Order follows first appearance so the result is stable.
 */
export function partitionByGrindGroup<T extends GrindReference>(
  entries: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const entry of entries) {
    const key = grindGroupKey(entry);
    if (key === null) {
      continue;
    }
    const group = groups.get(key);
    if (group) {
      group.push(entry);
    } else {
      groups.set(key, [entry]);
    }
  }
  return groups;
}

/**
 * Whether a reading is inside its scale's range. `clicks` and `notch` count up
 * from a minimum, `setting` may count from either end, and `microns` is a size
 * where smaller is finer — so only the counting units are range-checked.
 */
export function isGrindWithinScale(
  value: number,
  unit: GrindUnit | null,
  stepCount: number | null,
  isZeroBased: boolean
): boolean {
  if (stepCount === null || unit === null) {
    return true;
  }
  if (unit !== 'clicks' && unit !== 'notch' && unit !== 'setting') {
    return true;
  }
  const minimum = isZeroBased ? 0 : 1;
  return value >= minimum && value <= stepCount;
}

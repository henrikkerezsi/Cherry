import type { Bean, Brew, Plan, Tasting } from '../models';
import { deriveRatio } from './method-service';
import { meanOverallRating } from './tasting-service';

export interface StepTiming {
  pourDurationS: number | null;
  waitAfterS: number | null;
}

/**
 * A step's own length: the pour plus the wait that follows it. A step with
 * neither has no measurable duration.
 */
export function stepDurationS(step: StepTiming): number | null {
  const pour = step.pourDurationS ?? 0;
  const wait = step.waitAfterS ?? 0;
  const total = pour + wait;
  return total > 0 ? total : null;
}

/**
 * The measured brew time wins when it exists; otherwise the step durations are
 * summed. `brew_duration` is derived and never stored (idea.txt §13.3).
 */
export function derivedBrewDuration(
  steps: readonly StepTiming[],
  measuredTotalTimeS: number | null
): number | null {
  if (measuredTotalTimeS !== null) {
    return measuredTotalTimeS;
  }
  let total = 0;
  let measured = false;
  for (const step of steps) {
    const duration = stepDurationS(step);
    if (duration !== null) {
      total += duration;
      measured = true;
    }
  }
  return measured ? total : null;
}

export function brewRatio(brew: Pick<Brew, 'doseG' | 'waterTotalG'>): number | null {
  return deriveRatio(brew.doseG, brew.waterTotalG);
}

/** A brew keeps the bean's name even if the bean is later removed. */
export function beanNameSnapshot(bean: Pick<Bean, 'name'> | null): string | null {
  if (bean === null) {
    return null;
  }
  const name = bean.name.trim();
  return name === '' ? null : name;
}

export const BREW_DIFF_KNOBS = [
  'dose_g',
  'water_total_g',
  'water_temp_c',
  'total_time_s',
] as const;
export type BrewDiffKnob = (typeof BREW_DIFF_KNOBS)[number];

export interface BrewDiff {
  knob: BrewDiffKnob;
  planned: number | null;
  actual: number | null;
  delta: number | null;
}

type PlannedValues = Pick<Plan, 'doseG' | 'waterTotalG' | 'waterTempC' | 'expectedTotalTimeS'>;
type ActualValues = Pick<Brew, 'doseG' | 'waterTotalG' | 'waterTempC' | 'totalTimeS'>;

const KNOB_FIELDS: Record<BrewDiffKnob, [keyof PlannedValues, keyof ActualValues]> = {
  dose_g: ['doseG', 'doseG'],
  water_total_g: ['waterTotalG', 'waterTotalG'],
  water_temp_c: ['waterTempC', 'waterTempC'],
  total_time_s: ['expectedTotalTimeS', 'totalTimeS'],
};

/**
 * The gap between what a plan intended and what the brew actually did. This is
 * the primary learning signal (idea.txt §3.2), so it is reported, never hidden.
 * A knob that agrees on both sides is omitted.
 */
export function planBrewDiff(plan: PlannedValues, brew: ActualValues): BrewDiff[] {
  const diffs: BrewDiff[] = [];
  for (const knob of BREW_DIFF_KNOBS) {
    const [plannedKey, actualKey] = KNOB_FIELDS[knob];
    const planned = plan[plannedKey] as number | null;
    const actual = brew[actualKey] as number | null;
    if (planned === actual) {
      continue;
    }
    diffs.push({
      knob,
      planned,
      actual,
      delta: planned !== null && actual !== null ? actual - planned : null,
    });
  }
  return diffs;
}

export function countBrewsSince(brews: readonly Brew[], sinceDate: string): number {
  return brews.filter((brew) => !brew.deleted && brew.brewDate >= sinceDate).length;
}

function mostRecentFirst(brews: readonly Brew[]): Brew[] {
  return [...brews]
    .filter((brew) => !brew.deleted)
    .sort((a, b) => {
      if (a.brewDate !== b.brewDate) {
        return a.brewDate < b.brewDate ? 1 : -1;
      }
      return b.id - a.id;
    });
}

/**
 * The mean of the per-brew mean rating across the last `limit` brews, so that
 * re-tasting one brew is not confused with a second data point (idea.txt §10.5).
 */
export function averageRatingOfRecentBrews(
  brews: readonly Brew[],
  tastings: readonly Tasting[],
  limit: number
): number | null {
  const recentIds = mostRecentFirst(brews).slice(0, limit).map((brew) => brew.id);
  const perBrewMeans: number[] = [];
  for (const brewId of recentIds) {
    const mean = meanOverallRating(tastings.filter((tasting) => tasting.brewId === brewId));
    if (mean !== null) {
      perBrewMeans.push(mean);
    }
  }
  if (perBrewMeans.length === 0) {
    return null;
  }
  return perBrewMeans.reduce((total, mean) => total + mean, 0) / perBrewMeans.length;
}

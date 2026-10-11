import type { Brew, Plan, Tasting } from '../../src/models';
import {
  averageRatingOfRecentBrews,
  beanNameSnapshot,
  brewRatio,
  countBrewsSince,
  derivedBrewDuration,
  planBrewDiff,
  stepDurationS,
} from '../../src/services/brew-service';

function brew(partial: Partial<Brew>): Brew {
  return {
    id: partial.id ?? 1,
    uuid: partial.uuid ?? null,
    methodId: partial.methodId ?? 'v60',
    brewerId: partial.brewerId ?? null,
    beanId: partial.beanId ?? null,
    planId: partial.planId ?? null,
    recommendationId: partial.recommendationId ?? null,
    voiceSessionId: partial.voiceSessionId ?? null,
    brewDate: partial.brewDate ?? '2026-10-01',
    startedAt: partial.startedAt ?? null,
    endedAt: partial.endedAt ?? null,
    doseG: partial.doseG ?? null,
    waterTotalG: partial.waterTotalG ?? null,
    waterTempC: partial.waterTempC ?? null,
    yieldG: partial.yieldG ?? null,
    grinderId: partial.grinderId ?? null,
    grindSettingId: partial.grindSettingId ?? null,
    grindValue: partial.grindValue ?? null,
    grindUnit: partial.grindUnit ?? null,
    totalTimeS: partial.totalTimeS ?? null,
    beanNameSnapshot: partial.beanNameSnapshot ?? null,
    notes: partial.notes ?? null,
    createdAt: partial.createdAt ?? '2026-10-01T00:00:00.000Z',
    updatedAt: partial.updatedAt ?? null,
    deleted: partial.deleted ?? false,
  };
}

function plan(partial: Partial<Plan>): Plan {
  return {
    id: partial.id ?? 1,
    uuid: partial.uuid ?? null,
    name: partial.name ?? null,
    methodId: partial.methodId ?? 'v60',
    brewerId: partial.brewerId ?? null,
    beanId: partial.beanId ?? null,
    recipeId: partial.recipeId ?? null,
    recommendationId: partial.recommendationId ?? null,
    status: partial.status ?? 'planned',
    targetDate: partial.targetDate ?? null,
    doseG: partial.doseG ?? null,
    waterTotalG: partial.waterTotalG ?? null,
    waterTempC: partial.waterTempC ?? null,
    grinderId: partial.grinderId ?? null,
    grindSettingId: partial.grindSettingId ?? null,
    grindValue: partial.grindValue ?? null,
    grindUnit: partial.grindUnit ?? null,
    expectedTotalTimeS: partial.expectedTotalTimeS ?? null,
    notes: partial.notes ?? null,
    createdAt: partial.createdAt ?? '2026-10-01T00:00:00.000Z',
    updatedAt: partial.updatedAt ?? null,
    deleted: partial.deleted ?? false,
  };
}

function tasting(partial: Partial<Tasting>): Tasting {
  return {
    id: partial.id ?? 1,
    uuid: partial.uuid ?? null,
    brewId: partial.brewId ?? 1,
    verdict: partial.verdict ?? null,
    overallRating: partial.overallRating ?? null,
    tastedAt: partial.tastedAt ?? null,
    temperatureC: partial.temperatureC ?? null,
    attributeAcidity: partial.attributeAcidity ?? null,
    attributeSweetness: partial.attributeSweetness ?? null,
    attributeBody: partial.attributeBody ?? null,
    attributeBitterness: partial.attributeBitterness ?? null,
    attributeFinish: partial.attributeFinish ?? null,
    scaAroma: partial.scaAroma ?? null,
    scaFlavour: partial.scaFlavour ?? null,
    scaAftertaste: partial.scaAftertaste ?? null,
    scaAcidity: partial.scaAcidity ?? null,
    scaBody: partial.scaBody ?? null,
    scaBalance: partial.scaBalance ?? null,
    scaUniformity: partial.scaUniformity ?? null,
    scaCleanCup: partial.scaCleanCup ?? null,
    scaSweetness: partial.scaSweetness ?? null,
    scaOverall: partial.scaOverall ?? null,
    notes: partial.notes ?? null,
    createdAt: partial.createdAt ?? '2026-10-01T00:00:00.000Z',
    updatedAt: partial.updatedAt ?? null,
    deleted: partial.deleted ?? false,
  };
}

describe('stepDurationS', () => {
  it('adds the pour and the wait that follows it', () => {
    expect(stepDurationS({ pourDurationS: 30, waitAfterS: 45 })).toBe(75);
  });

  it('counts a wait-only step', () => {
    expect(stepDurationS({ pourDurationS: null, waitAfterS: 240 })).toBe(240);
  });

  it('treats a step with no timing as having none', () => {
    expect(stepDurationS({ pourDurationS: null, waitAfterS: null })).toBeNull();
    expect(stepDurationS({ pourDurationS: 0, waitAfterS: 0 })).toBeNull();
  });
});

describe('derivedBrewDuration', () => {
  it('prefers the measured total time', () => {
    const steps = [{ pourDurationS: 30, waitAfterS: 15 }];
    expect(derivedBrewDuration(steps, 165)).toBe(165);
  });

  it('sums step durations when nothing was measured', () => {
    const steps = [
      { pourDurationS: 30, waitAfterS: 45 },
      { pourDurationS: 20, waitAfterS: 0 },
      { pourDurationS: null, waitAfterS: 40 },
    ];
    expect(derivedBrewDuration(steps, null)).toBe(135);
  });

  it('is null when no step carries timing and nothing was measured', () => {
    expect(derivedBrewDuration([{ pourDurationS: null, waitAfterS: null }], null)).toBeNull();
  });
});

describe('brewRatio', () => {
  it('derives water over dose', () => {
    expect(brewRatio({ doseG: 15, waterTotalG: 250 })).toBeCloseTo(16.666, 2);
  });

  it('is null without both values', () => {
    expect(brewRatio({ doseG: null, waterTotalG: 250 })).toBeNull();
    expect(brewRatio({ doseG: 15, waterTotalG: null })).toBeNull();
  });
});

describe('beanNameSnapshot', () => {
  it('trims the bean name', () => {
    expect(beanNameSnapshot({ name: '  Kenya Nyeri  ' })).toBe('Kenya Nyeri');
  });

  it('is null for a missing or blank name', () => {
    expect(beanNameSnapshot(null)).toBeNull();
    expect(beanNameSnapshot({ name: '   ' })).toBeNull();
  });
});

describe('planBrewDiff', () => {
  it('reports only the knobs that disagree, with a signed delta', () => {
    const planned = plan({ doseG: 15, waterTotalG: 250, waterTempC: 93, expectedTotalTimeS: 165 });
    const actual = brew({ doseG: 16, waterTotalG: 250, waterTempC: 93, totalTimeS: 150 });

    expect(planBrewDiff(planned, actual)).toEqual([
      { knob: 'dose_g', planned: 15, actual: 16, delta: 1 },
      { knob: 'total_time_s', planned: 165, actual: 150, delta: -15 },
    ]);
  });

  it('has no delta when one side is empty', () => {
    const planned = plan({ doseG: 15 });
    const actual = brew({ doseG: null });
    expect(planBrewDiff(planned, actual)).toEqual([
      { knob: 'dose_g', planned: 15, actual: null, delta: null },
    ]);
  });

  it('is empty when the brew matched the plan', () => {
    const planned = plan({ doseG: 18, waterTotalG: 36, expectedTotalTimeS: 28 });
    const actual = brew({ doseG: 18, waterTotalG: 36, totalTimeS: 28 });
    expect(planBrewDiff(planned, actual)).toEqual([]);
  });
});

describe('countBrewsSince', () => {
  it('counts undeleted brews on or after the date', () => {
    const brews = [
      brew({ id: 1, brewDate: '2026-10-01' }),
      brew({ id: 2, brewDate: '2026-09-30' }),
      brew({ id: 3, brewDate: '2026-10-05', deleted: true }),
    ];
    expect(countBrewsSince(brews, '2026-10-01')).toBe(1);
  });
});

describe('averageRatingOfRecentBrews', () => {
  it('averages per-brew means across the most recent brews only', () => {
    const brews = [
      brew({ id: 1, brewDate: '2026-10-01' }),
      brew({ id: 2, brewDate: '2026-10-02' }),
      brew({ id: 3, brewDate: '2026-10-03' }),
    ];
    const tastings = [
      tasting({ id: 1, brewId: 1, overallRating: 1 }),
      tasting({ id: 2, brewId: 2, overallRating: 4 }),
      tasting({ id: 3, brewId: 2, overallRating: 4 }),
      tasting({ id: 4, brewId: 3, overallRating: 5 }),
      tasting({ id: 5, brewId: 3, overallRating: 3 }),
    ];
    // Brews 3 and 2 are in scope; each collapses to one mean (4), then averaged.
    expect(averageRatingOfRecentBrews(brews, tastings, 2)).toBe(4);
  });

  it('is null when there is no data', () => {
    expect(averageRatingOfRecentBrews([], [], 10)).toBeNull();
  });
});

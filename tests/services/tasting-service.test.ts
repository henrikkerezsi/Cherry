import type { Tasting } from '../../src/models';
import {
  latestRatedTasting,
  latestTasting,
  meanOverallRating,
  primaryRating,
  summarizeTastings,
} from '../../src/services/tasting-service';

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
    createdAt: partial.createdAt ?? '2026-01-01T00:00:00.000Z',
    updatedAt: partial.updatedAt ?? null,
    deleted: partial.deleted ?? false,
  };
}

describe('latestTasting', () => {
  it('picks the tasting with the newest tasted_at', () => {
    const older = tasting({ id: 1, tastedAt: '2026-01-01T08:00:00.000Z' });
    const newer = tasting({ id: 2, tastedAt: '2026-01-02T08:00:00.000Z' });
    expect(latestTasting([older, newer])?.id).toBe(2);
  });

  it('falls back to created_at when no tasting time is recorded', () => {
    const older = tasting({ id: 1, createdAt: '2026-01-01T08:00:00.000Z' });
    const newer = tasting({ id: 2, createdAt: '2026-01-02T08:00:00.000Z' });
    expect(latestTasting([older, newer])?.id).toBe(2);
  });

  it('breaks a same-time tie by the higher id', () => {
    const first = tasting({ id: 3, tastedAt: '2026-01-01T08:00:00.000Z' });
    const second = tasting({ id: 4, tastedAt: '2026-01-01T08:00:00.000Z' });
    expect(latestTasting([first, second])?.id).toBe(4);
  });

  it('is null when there are no tastings', () => {
    expect(latestTasting([])).toBeNull();
  });
});

describe('latestRatedTasting', () => {
  it('skips an unrated re-taste so the remembered rating survives', () => {
    const rated = tasting({ id: 1, overallRating: 4, tastedAt: '2026-01-01T08:00:00.000Z' });
    const unrated = tasting({ id: 2, overallRating: null, tastedAt: '2026-01-02T08:00:00.000Z' });
    expect(latestRatedTasting([rated, unrated])?.id).toBe(1);
  });

  it('reports the newer rating when both are rated', () => {
    const older = tasting({ id: 1, overallRating: 2, tastedAt: '2026-01-01T08:00:00.000Z' });
    const newer = tasting({ id: 2, overallRating: 5, tastedAt: '2026-01-02T08:00:00.000Z' });
    expect(latestRatedTasting([older, newer])?.overallRating).toBe(5);
  });
});

describe('primaryRating', () => {
  it('uses the latest tasting that carries a rating', () => {
    const first = tasting({ id: 1, overallRating: 3, tastedAt: '2026-01-01T08:00:00.000Z' });
    const second = tasting({ id: 2, overallRating: 5, tastedAt: '2026-01-02T08:00:00.000Z' });
    expect(primaryRating([first, second])).toBe(5);
  });

  it('is null when nothing is rated', () => {
    expect(primaryRating([tasting({ id: 1 })])).toBeNull();
  });
});

describe('meanOverallRating', () => {
  it('averages every non-null overall rating', () => {
    const tastings = [
      tasting({ id: 1, overallRating: 2 }),
      tasting({ id: 2, overallRating: 4 }),
      tasting({ id: 3, overallRating: null }),
    ];
    expect(meanOverallRating(tastings)).toBe(3);
  });

  it('is null when no tasting has a rating', () => {
    expect(meanOverallRating([tasting({ id: 1 })])).toBeNull();
  });

  it('ignores deleted tastings', () => {
    const tastings = [
      tasting({ id: 1, overallRating: 5 }),
      tasting({ id: 2, overallRating: 1, deleted: true }),
    ];
    expect(meanOverallRating(tastings)).toBe(5);
  });
});

describe('summarizeTastings', () => {
  it('reports count, the latest tasting and both aggregate ratings', () => {
    const tastings = [
      tasting({ id: 1, overallRating: 2, tastedAt: '2026-01-01T08:00:00.000Z' }),
      tasting({ id: 2, overallRating: 4, tastedAt: '2026-01-03T08:00:00.000Z' }),
      tasting({ id: 3, overallRating: 4, tastedAt: '2026-01-02T08:00:00.000Z' }),
    ];
    const summary = summarizeTastings(tastings);
    expect(summary.count).toBe(3);
    expect(summary.latest?.id).toBe(2);
    expect(summary.primaryRating).toBe(4);
    expect(summary.meanRating).toBeCloseTo(3.333, 3);
  });
});

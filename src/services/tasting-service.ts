import type { Tasting } from '../models';

/**
 * A tasting's position in time. `tasted_at` is the moment the user judged the
 * cup; `created_at` is only a fallback for a tasting that never recorded one.
 */
function tastedKey(tasting: Tasting): string {
  return tasting.tastedAt ?? tasting.createdAt;
}

function isLater(candidate: Tasting, than: Tasting): boolean {
  const candidateKey = tastedKey(candidate);
  const thanKey = tastedKey(than);
  if (candidateKey !== thanKey) {
    return candidateKey > thanKey;
  }
  return candidate.id > than.id;
}

export function latestTasting(tastings: readonly Tasting[]): Tasting | null {
  let latest: Tasting | null = null;
  for (const tasting of tastings) {
    if (tasting.deleted) {
      continue;
    }
    if (latest === null || isLater(tasting, latest)) {
      latest = tasting;
    }
  }
  return latest;
}

/**
 * The most recent tasting that actually carries a rating. An unrated re-taste
 * must not erase the rating the user remembers from the one before it.
 */
export function latestRatedTasting(tastings: readonly Tasting[]): Tasting | null {
  let latest: Tasting | null = null;
  for (const tasting of tastings) {
    if (tasting.deleted || tasting.overallRating === null) {
      continue;
    }
    if (latest === null || isLater(tasting, latest)) {
      latest = tasting;
    }
  }
  return latest;
}

/** The rating shown against a brew: the latest tasting that has one. */
export function primaryRating(tastings: readonly Tasting[]): number | null {
  return latestRatedTasting(tastings)?.overallRating ?? null;
}

/**
 * The rating the recommender uses: the mean of every non-null overall rating,
 * so re-tasting one brew is not mistaken for a second data point (idea.txt §10.5).
 */
export function meanOverallRating(tastings: readonly Tasting[]): number | null {
  const ratings = tastings
    .filter((tasting) => !tasting.deleted && tasting.overallRating !== null)
    .map((tasting) => tasting.overallRating as number);
  if (ratings.length === 0) {
    return null;
  }
  return ratings.reduce((total, rating) => total + rating, 0) / ratings.length;
}

export interface TastingSummary {
  count: number;
  latest: Tasting | null;
  primaryRating: number | null;
  meanRating: number | null;
}

export function summarizeTastings(tastings: readonly Tasting[]): TastingSummary {
  const active = tastings.filter((tasting) => !tasting.deleted);
  return {
    count: active.length,
    latest: latestTasting(active),
    primaryRating: primaryRating(active),
    meanRating: meanOverallRating(active),
  };
}

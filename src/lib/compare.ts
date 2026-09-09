import { CATEGORY_COLUMNS, type ParsedCategoryScores, type Score } from "./types";

export type DeltaStatus = "improved" | "regressed" | "unchanged" | "n/a";

export interface CategoryDelta {
  key: keyof ParsedCategoryScores;
  category: string;
  scoreA: Score;
  scoreB: Score;
  delta: number | null;
  status: DeltaStatus;
}

/**
 * runA = baseline, runB = comparison ("current"). Ported from the old CLI's
 * compareRuns.js, with the undefined-vs-null bug fixed: the original iterated
 * Object.keys(runB.categories) and read runA.categories[key], which was
 * `undefined` (not `null`) when runA lacked that category — a `!== null`
 * guard let that slip through and produced NaN instead of an 'n/a' status.
 * Here every category is a fixed, always-present nullable column, so this
 * can't happen, but the `== null` check stays defensive.
 */
export function computeDeltas(
  runA: ParsedCategoryScores,
  runB: ParsedCategoryScores,
): CategoryDelta[] {
  return CATEGORY_COLUMNS.map(({ key, label }) => {
    const scoreA = runA[key];
    const scoreB = runB[key];
    const delta = scoreA == null || scoreB == null ? null : scoreB - scoreA;
    const status: DeltaStatus =
      delta == null ? "n/a" : delta > 0 ? "improved" : delta < 0 ? "regressed" : "unchanged";

    return { key, category: label, scoreA, scoreB, delta, status };
  });
}

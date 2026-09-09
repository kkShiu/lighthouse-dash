import type { ParsedAudit } from "./types";

export interface Recommendation {
  id: string;
  title: string;
  description: string | null;
}

const MAX_RECOMMENDATIONS_PER_CATEGORY = 5;

/**
 * Picks the lowest-scoring, actionable audits for one Lighthouse category
 * from a run's stored audits — these are the concrete "what to fix" items
 * Lighthouse itself already generates per audit. "Actionable" excludes audits
 * that passed (score === 100) and ones with no binary/numeric pass-fail
 * concept (Lighthouse's "informative"/"manual"/"notApplicable" audits, which
 * this app's data model doesn't separately track — approximated here by
 * requiring a non-null score below 100).
 */
export function pickRecommendations(
  audits: ParsedAudit[],
  lhCategory: string,
): Recommendation[] {
  return audits
    // audits.categories is absent on runs stored before this field was added;
    // treat those as having no category data rather than throwing.
    .filter((a) => (a.categories ?? []).includes(lhCategory) && a.score !== null && a.score < 100)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, MAX_RECOMMENDATIONS_PER_CATEGORY)
    .map((a) => ({ id: a.id, title: a.title, description: a.description }));
}
